import { Router } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'
import { createAsset, runTranscodeJob } from '../../modules/assets/transcode'
import { generateUploadUrls } from '../../modules/playback/service'
import { prisma } from '@netflix/db'

export const assetsRouter = Router()

assetsRouter.post(
  '/upload-urls',
  authenticate,
  adminOnly,
  validate({
    body: z.object({ contentId: z.string(), parts: z.number().int().min(1).max(10).optional() }),
  }),
  async (req, res, next) => {
    try {
      const { contentId, parts } = req.body as { contentId: string; parts?: number }
      const urls = generateUploadUrls(contentId, parts ?? 1)
      const asset = await createAsset(contentId, urls.key)
      res.json({ data: { ...urls, assetId: asset.id } })
    } catch (err) {
      next(err)
    }
  }
)

assetsRouter.post(
  '/:assetId/transcode',
  authenticate,
  adminOnly,
  async (req, res, next) => {
    try {
      await runTranscodeJob(req.params['assetId']!)
      const asset = await prisma.asset.findUnique({ where: { id: req.params['assetId'] } })
      res.json({ data: asset })
    } catch (err) {
      next(err)
    }
  }
)

assetsRouter.get('/:contentId', authenticate, adminOnly, async (req, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { contentId: req.params['contentId'] },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: assets })
  } catch (err) {
    next(err)
  }
})

assetsRouter.post(
  '/:contentId/captions',
  authenticate,
  adminOnly,
  validate({
    body: z.object({ language: z.string(), url: z.string().url() }),
  }),
  async (req, res, next) => {
    try {
      const { language, url } = req.body as { language: string; url: string }
      const caption = await prisma.caption.create({
        data: { contentId: req.params['contentId'], language, url },
      })
      res.json({ data: caption })
    } catch (err) {
      next(err)
    }
  }
)
