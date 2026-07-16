import { Router, raw } from 'express'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import { z } from 'zod'
import { issuePlaybackToken, recordQoEEvent, generateUploadUrls } from '../../modules/playback/service'
import { heartbeatSession } from '../../modules/sessions/service'
import { AppError } from '../../middleware/errorHandler'

export const playbackRouter = Router()

playbackRouter.post(
  '/:contentId',
  authenticate,
  validate({
    params: z.object({ contentId: z.string() }),
    body: z.object({
      profileId: z.string().optional(),
      deviceId: z.string().optional(),
      episodeId: z.string().optional(),
      region: z.string().optional(),
    }).optional(),
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const body = (req.body ?? {}) as {
        profileId?: string
        deviceId?: string
        episodeId?: string
        region?: string
      }
      const result = await issuePlaybackToken(
        req.userId!,
        req.params['contentId']!,
        body
      )
      res.json({ data: result })
    } catch (err) {
      if (err instanceof Error && err.message.includes('entitled')) {
        return next(new AppError(403, err.message))
      }
      return next(err)
    }
  }
)

playbackRouter.post(
  '/sessions/:sessionId/heartbeat',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const ok = await heartbeatSession(req.params['sessionId']!, req.userId!)
      if (!ok) throw new AppError(404, 'Session not found')
      res.json({ data: { ok: true } })
    } catch (err) {
      next(err)
    }
  }
)

playbackRouter.post(
  '/qoe',
  authenticate,
  validate({
    body: z.object({
      contentId: z.string(),
      eventType: z.string(),
      metadata: z.record(z.unknown()).optional(),
    }),
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const { contentId, eventType, metadata } = req.body as {
        contentId: string
        eventType: string
        metadata?: Record<string, unknown>
      }
      await recordQoEEvent(req.userId, contentId, eventType, metadata)
      res.json({ data: { recorded: true } })
    } catch (err) {
      next(err)
    }
  }
)

playbackRouter.get('/drm/:provider/:contentId', authenticate, async (req, res) => {
  res.json({
    data: {
      licenseUrl: `/api/v1/playback/drm/license/${req.params['provider']}/${req.params['contentId']}`,
      provider: req.params['provider'],
    },
  })
})
