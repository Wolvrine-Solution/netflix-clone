import { Router } from 'express'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { AppError } from '../middleware/errorHandler'

export const watchHistoryRouter = Router()

watchHistoryRouter.get('/:profileId/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profile = await prisma.profile.findFirst({
      where: { id: req.params['profileId'], userId: req.userId },
    })
    if (!profile) throw new AppError(403, 'Forbidden')
    const history = await prisma.watchHistory.findMany({
      where: { profileId: req.params['profileId'], progress: { gt: 0.05 } },
      include: { content: { include: { genres: { include: { genre: true } } } } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })
    res.json({ data: history })
  } catch (err) {
    next(err)
  }
})

watchHistoryRouter.put('/:profileId/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { contentId, progress } = req.body as { contentId: string; progress: number }
    const profile = await prisma.profile.findFirst({
      where: { id: req.params['profileId'], userId: req.userId },
    })
    if (!profile) throw new AppError(403, 'Forbidden')
    const record = await prisma.watchHistory.upsert({
      where: { profileId_contentId: { profileId: req.params['profileId']!, contentId } },
      update: { progress },
      create: { profileId: req.params['profileId']!, contentId, progress },
    })
    res.json({ data: record })
  } catch (err) {
    next(err)
  }
})
