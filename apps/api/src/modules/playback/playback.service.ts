import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { and, eq, qoeEvent, watchHistory, type Database } from '@netflix/db'
import { AppError } from '../../common/app-error'
import { DB, ENV } from '../../common/tokens'
import type { Env } from '../../config/env'
import { EntitlementsService } from '../entitlements/entitlements.service'
import { SessionsService } from '../sessions/sessions.service'
import { signUrl as sign } from './url-signer'

export interface PlaybackTokenResult {
  manifestUrl: string
  dashUrl?: string
  captions: Array<{ language: string; url: string }>
  startPosition: number
  qualityCap?: string
  drm?: { widevine?: string; fairplay?: string; playready?: string }
  sessionId: string
}

const FALLBACK_MANIFEST =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

@Injectable()
export class PlaybackService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(ENV) private readonly env: Env,
    @Inject(EntitlementsService) private readonly entitlements: EntitlementsService,
    @Inject(SessionsService) private readonly sessions: SessionsService
  ) {}

  /** CDN signed URL using CDN_SIGNING_SECRET (falls back to NEXTAUTH_SECRET). */
  signUrl(url: string, ttlSec = 3600, secretOverride?: string): string {
    return sign(
      url,
      secretOverride ?? this.env.CDN_SIGNING_SECRET ?? this.env.NEXTAUTH_SECRET,
      ttlSec
    )
  }

  async issuePlaybackToken(
    userId: string,
    contentId: string,
    opts: { profileId?: string; deviceId?: string; episodeId?: string; region?: string }
  ): Promise<PlaybackTokenResult> {
    const entitlement = await this.entitlements.can(userId, 'play', { contentId })
    if (!entitlement.allowed) throw new AppError(403, entitlement.reason ?? 'Not entitled')

    const content = await this.db.query.content.findFirst({
      where: (c, { eq: e }) => e(c.id, contentId),
      with: {
        videoFiles: true,
        assets: { where: (a, { eq: e }) => e(a.status, 'READY') },
        captions: true,
      },
    })
    if (!content) throw new AppError(404, 'Content not found')

    const sessionId = await this.sessions.register(
      userId,
      opts.profileId,
      opts.deviceId ?? 'web',
      entitlement.qualityCap
    )

    let manifestUrl: string | null | undefined = content.videoUrl
    let dashUrl: string | undefined

    const readyAsset = content.assets[0]
    if (readyAsset?.hlsUrl) {
      manifestUrl = readyAsset.hlsUrl
      dashUrl = readyAsset.dashUrl ?? undefined
    } else if (content.videoFiles.length > 0) {
      const vf = content.videoFiles.find((v) => v.isDefault) ?? content.videoFiles[0]
      manifestUrl = vf?.url
    }
    if (!manifestUrl) manifestUrl = FALLBACK_MANIFEST

    const history = opts.profileId
      ? await this.db.query.watchHistory.findFirst({
          where: and(
            eq(watchHistory.profileId, opts.profileId),
            eq(watchHistory.contentId, contentId)
          ),
        })
      : null

    const drm = readyAsset?.drmKeyId
      ? {
          widevine: `/api/v1/playback/drm/widevine/${contentId}`,
          fairplay: `/api/v1/playback/drm/fairplay/${contentId}`,
          playready: `/api/v1/playback/drm/playready/${contentId}`,
        }
      : undefined

    if (entitlement.qualityCap === '720p' && manifestUrl.includes('4k')) {
      manifestUrl = manifestUrl.replace('4k', '720p')
    }

    return {
      manifestUrl: this.signUrl(manifestUrl),
      dashUrl: dashUrl ? this.signUrl(dashUrl) : undefined,
      captions: content.captions.map((c) => ({ language: c.language, url: this.signUrl(c.url) })),
      startPosition: history?.progress ?? 0,
      qualityCap: entitlement.qualityCap,
      drm,
      sessionId,
    }
  }

  async recordQoEEvent(
    userId: string | undefined,
    contentId: string,
    eventType: string,
    metadata?: Record<string, unknown>
  ) {
    await this.db
      .insert(qoeEvent)
      .values({ userId, contentId, eventType, metadata: metadata ?? {} })
  }

  generateUploadUrls(contentId: string, parts = 1) {
    const base = this.env.S3_ENDPOINT ?? 'http://localhost:9000'
    const key = `uploads/${contentId}/${randomUUID()}`
    const urls = Array.from({ length: parts }, (_, i) => ({
      partNumber: i + 1,
      url: `${base}/${this.env.S3_BUCKET}/${key}?part=${i + 1}`,
    }))
    return { key, urls }
  }
}
