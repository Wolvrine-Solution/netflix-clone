import { Inject, Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import {
  asset,
  caption,
  content,
  desc,
  eq,
  outboxEvent,
  videoFile,
  type Database,
} from '@netflix/db'
import type { AssetStatus } from '@netflix/db'
import { AppError } from '../../common/app-error'
import { DB } from '../../common/tokens'

export interface AdvanceData {
  manifestUrl?: string
  hlsUrl?: string
  dashUrl?: string
  drmKeyId?: string
  error?: string
}

@Injectable()
export class AssetsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(PinoLogger) private readonly logger: PinoLogger
  ) {}

  async createAsset(contentId: string, sourceKey: string) {
    const [exists] = await this.db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.id, contentId))
    if (!exists) throw new AppError(404, 'Content not found')
    const [created] = await this.db
      .insert(asset)
      .values({ contentId, sourceKey, status: 'UPLOADED' })
      .returning()
    return created!
  }

  findById(assetId: string) {
    return this.db.query.asset.findFirst({ where: eq(asset.id, assetId) })
  }

  listForContent(contentId: string) {
    return this.db
      .select()
      .from(asset)
      .where(eq(asset.contentId, contentId))
      .orderBy(desc(asset.createdAt))
  }

  async addCaption(contentId: string, language: string, url: string) {
    const [created] = await this.db.insert(caption).values({ contentId, language, url }).returning()
    return created!
  }

  /** Move an asset to a new status; reaching READY emits a `content.ready` outbox event. */
  async advanceAsset(assetId: string, status: AssetStatus, data?: AdvanceData) {
    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(asset)
        .set({ status, ...data })
        .where(eq(asset.id, assetId))
        .returning()
      if (!updated) throw new AppError(404, 'Asset not found')
      if (status === 'READY' && updated.contentId) {
        await tx.insert(outboxEvent).values({
          aggregateType: 'Content',
          aggregateId: updated.contentId,
          eventType: 'content.ready',
          contentId: updated.contentId,
          payload: { assetId },
        })
      }
      return updated
    })
  }

  /** Simulated pipeline: UPLOADED -> TRANSCODING -> PACKAGED -> READY (+ default/720p renditions). */
  async runTranscodeJob(assetId: string) {
    const current = await this.findById(assetId)
    if (!current) throw new AppError(404, 'Asset not found')

    await this.advanceAsset(assetId, 'TRANSCODING')
    this.logger.info({ assetId }, 'Transcode started')

    try {
      const base = current.sourceKey.replace(/^uploads\//, '')
      const hlsUrl = `https://cdn.example.com/vod/${base}/master.m3u8`
      const dashUrl = `https://cdn.example.com/vod/${base}/manifest.mpd`

      await this.advanceAsset(assetId, 'PACKAGED', { hlsUrl, dashUrl })
      await this.advanceAsset(assetId, 'READY', {
        manifestUrl: hlsUrl,
        hlsUrl,
        dashUrl,
        drmKeyId: `drm-${assetId}`,
      })

      if (current.contentId) {
        await this.db.insert(videoFile).values([
          {
            contentId: current.contentId,
            quality: 'Q_1080P',
            url: hlsUrl,
            format: 'hls',
            isDefault: true,
          },
          {
            contentId: current.contentId,
            quality: 'Q_720P',
            url: hlsUrl.replace('master', '720p'),
            format: 'hls',
            isDefault: false,
          },
        ])
      }
      this.logger.info({ assetId }, 'Transcode complete')
    } catch (err) {
      await this.advanceAsset(assetId, 'FAILED', {
        error: err instanceof Error ? err.message : 'Transcode failed',
      })
      throw err
    }
  }
}
