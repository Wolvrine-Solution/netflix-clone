import { prisma } from '@netflix/db'
import { AssetStatus } from '@prisma/client'
import { logger } from '../../lib/logger'

export async function createAsset(contentId: string, sourceKey: string) {
  return prisma.asset.create({
    data: { contentId, sourceKey, status: AssetStatus.UPLOADED },
  })
}

export async function advanceAsset(
  assetId: string,
  status: AssetStatus,
  data?: {
    manifestUrl?: string
    hlsUrl?: string
    dashUrl?: string
    drmKeyId?: string
    error?: string
  }
) {
  const asset = await prisma.asset.update({
    where: { id: assetId },
    data: { status, ...data },
    include: { content: true },
  })

  if (status === AssetStatus.READY && asset.contentId) {
    await prisma.outboxEvent.create({
      data: {
        aggregateType: 'Content',
        aggregateId: asset.contentId,
        eventType: 'content.ready',
        contentId: asset.contentId,
        payload: { assetId },
      },
    })
  }

  return asset
}

export async function runTranscodeJob(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error('Asset not found')

  await advanceAsset(assetId, AssetStatus.TRANSCODING)
  logger.info({ assetId }, 'Transcode started')

  try {
    const base = asset.sourceKey.replace(/^uploads\//, '')
    const hlsUrl = `https://cdn.example.com/vod/${base}/master.m3u8`
    const dashUrl = `https://cdn.example.com/vod/${base}/manifest.mpd`

    await advanceAsset(assetId, AssetStatus.PACKAGED, { hlsUrl, dashUrl })
    await advanceAsset(assetId, AssetStatus.READY, {
      manifestUrl: hlsUrl,
      hlsUrl,
      dashUrl,
      drmKeyId: `drm-${assetId}`,
    })

    if (asset.contentId) {
      const qualities = [
        { quality: 'Q_1080P' as const, url: hlsUrl },
        { quality: 'Q_720P' as const, url: hlsUrl.replace('master', '720p') },
      ]
      for (const q of qualities) {
        await prisma.videoFile.create({
          data: {
            contentId: asset.contentId,
            quality: q.quality,
            url: q.url,
            format: 'hls',
            isDefault: q.quality === 'Q_1080P',
          },
        })
      }
    }

    logger.info({ assetId }, 'Transcode complete')
  } catch (err) {
    await advanceAsset(assetId, AssetStatus.FAILED, {
      error: err instanceof Error ? err.message : 'Transcode failed',
    })
    throw err
  }
}
