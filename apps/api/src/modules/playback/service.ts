import { createHmac, randomUUID } from 'crypto'
import { prisma } from '@netflix/db'
import { getEnv } from '../../lib/env'
import { can } from '../entitlements/service'
import { registerPlaybackSession } from '../sessions/service'

export interface PlaybackTokenResult {
  manifestUrl: string
  dashUrl?: string
  captions: Array<{ language: string; url: string }>
  startPosition: number
  qualityCap?: string
  drm?: { widevine?: string; fairplay?: string; playready?: string }
  sessionId: string
}

/** CDN signed URL helper — exported for unit tests. */
export function signUrl(url: string, ttlSec = 3600, secretOverride?: string): string {
  const secret = secretOverride ?? getEnv().CDN_SIGNING_SECRET ?? getEnv().NEXTAUTH_SECRET
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  const sig = createHmac('sha256', secret).update(`${url}:${exp}`).digest('hex')
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}exp=${exp}&sig=${sig}`
}

export async function issuePlaybackToken(
  userId: string,
  contentId: string,
  opts: { profileId?: string; deviceId?: string; episodeId?: string; region?: string }
): Promise<PlaybackTokenResult> {
  const entitlement = await can(userId, 'play', { contentId })
  if (!entitlement.allowed) {
    throw new Error(entitlement.reason ?? 'Not entitled')
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      videoFiles: true,
      assets: { where: { status: 'READY' } },
      captions: true,
      contentSeasons: opts.episodeId
        ? { include: { episodes: { where: { id: opts.episodeId }, include: { videoFiles: true } } } }
        : false,
    },
  })
  if (!content) throw new Error('Content not found')

  const sessionId = await registerPlaybackSession(
    userId,
    opts.profileId,
    opts.deviceId ?? 'web',
    entitlement.qualityCap
  )

  let manifestUrl = content.videoUrl
  let dashUrl: string | undefined

  const readyAsset = content.assets[0]
  if (readyAsset?.hlsUrl) {
    manifestUrl = readyAsset.hlsUrl
    dashUrl = readyAsset.dashUrl ?? undefined
  } else if (content.videoFiles.length > 0) {
    const vf = content.videoFiles.find((v) => v.isDefault) ?? content.videoFiles[0]
    manifestUrl = vf?.url
  }

  if (!manifestUrl) {
    manifestUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }

  const history = opts.profileId
    ? await prisma.watchHistory.findUnique({
        where: { profileId_contentId: { profileId: opts.profileId, contentId } },
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
    manifestUrl: signUrl(manifestUrl),
    dashUrl: dashUrl ? signUrl(dashUrl) : undefined,
    captions: content.captions.map((c) => ({ language: c.language, url: signUrl(c.url) })),
    startPosition: history?.progress ?? 0,
    qualityCap: entitlement.qualityCap,
    drm,
    sessionId,
  }
}

export async function recordQoEEvent(
  userId: string | undefined,
  contentId: string,
  eventType: string,
  metadata?: Record<string, unknown>
) {
  await prisma.qoEEvent.create({
    data: { userId, contentId, eventType, metadata: metadata ?? {} },
  })
}

export function generateUploadUrls(contentId: string, parts = 1) {
  const base = getEnv().S3_ENDPOINT ?? 'http://localhost:9000'
  const bucket = getEnv().S3_BUCKET
  const key = `uploads/${contentId}/${randomUUID()}`
  const urls = Array.from({ length: parts }, (_, i) => ({
    partNumber: i + 1,
    url: `${base}/${bucket}/${key}?part=${i + 1}`,
  }))
  return { key, urls }
}
