import { Router } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'
import {
  listLiveChannels,
  getLiveEvent,
  archiveEndedEvent,
  checkGeoRestriction,
} from '../../modules/live/service'
import { prisma } from '@netflix/db'
import { LiveEventStatus } from '@prisma/client'
import { AppError } from '../../middleware/errorHandler'
import { issuePlaybackToken } from '../../modules/playback/service'

export const liveRouter = Router()

liveRouter.get('/channels', async (_req, res, next) => {
  try {
    const channels = await listLiveChannels()
    res.json({ data: channels })
  } catch (err) {
    next(err)
  }
})

liveRouter.get('/events/:eventId', async (req, res, next) => {
  try {
    const event = await getLiveEvent(req.params['eventId']!)
    if (!event) throw new AppError(404, 'Event not found')
    res.json({ data: event })
  } catch (err) {
    next(err)
  }
})

liveRouter.post('/events/:eventId/playback', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const event = await getLiveEvent(req.params['eventId']!)
    if (!event) throw new AppError(404, 'Event not found')
    const region = (req.query['region'] as string) ?? undefined
    if (!checkGeoRestriction(event, region)) {
      throw new AppError(403, 'Geo-restricted')
    }
    if (event.archivedContentId) {
      const token = await issuePlaybackToken(req.userId!, event.archivedContentId, {})
      return res.json({ data: { ...token, mode: 'dvr' } })
    }
    res.json({
      data: {
        manifestUrl: event.playbackUrl,
        mode: event.status === LiveEventStatus.LIVE ? 'live' : 'slate',
        slatePreUrl: event.slatePreUrl,
        slatePostUrl: event.slatePostUrl,
        dvrWindowSec: event.dvrWindowSec,
      },
    })
  } catch (err) {
    next(err)
  }
})

liveRouter.post(
  '/events',
  authenticate,
  adminOnly,
  validate({
    body: z.object({
      channelId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      scheduledStart: z.string().datetime(),
      scheduledEnd: z.string().datetime().optional(),
      ingestUrl: z.string().optional(),
      playbackUrl: z.string().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const body = req.body as {
        channelId: string
        title: string
        description?: string
        scheduledStart: string
        scheduledEnd?: string
        ingestUrl?: string
        playbackUrl?: string
      }
      const event = await prisma.liveEvent.create({ data: body })
      res.status(201).json({ data: event })
    } catch (err) {
      next(err)
    }
  }
)

liveRouter.post('/events/:eventId/archive', authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.liveEvent.update({
      where: { id: req.params['eventId'] },
      data: { status: LiveEventStatus.ENDED },
    })
    const contentId = await archiveEndedEvent(req.params['eventId']!)
    res.json({ data: { contentId } })
  } catch (err) {
    next(err)
  }
})
