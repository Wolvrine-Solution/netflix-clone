import { Router } from 'express'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { AppError } from '../middleware/errorHandler'

export const myListRouter = Router()

myListRouter.get('/:profileId/my-list', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profile = await prisma.profile.findFirst({
      where: { id: req.params['profileId'], userId: req.userId },
    })
    if (!profile) throw new AppError(403, 'Forbidden')
    const items = await prisma.myListItem.findMany({
      where: { profileId: req.params['profileId'] },
      include: { content: { include: { genres: { include: { genre: true } } } } },
      orderBy: { addedAt: 'desc' },
    })
    res.json({ data: items.map((i) => i.content) })
  } catch (err) {
    next(err)
  }
})

myListRouter.post('/:profileId/my-list', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { contentId } = req.body as { contentId: string }
    const profile = await prisma.profile.findFirst({
      where: { id: req.params['profileId'], userId: req.userId },
    })
    if (!profile) throw new AppError(403, 'Forbidden')
    const item = await prisma.myListItem.create({
      data: { profileId: req.params['profileId']!, contentId },
    })
    res.status(201).json({ data: item })
  } catch (err) {
    next(err)
  }
})

myListRouter.delete(
  '/:profileId/my-list/:contentId',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const profile = await prisma.profile.findFirst({
        where: { id: req.params['profileId'], userId: req.userId },
      })
      if (!profile) throw new AppError(403, 'Forbidden')
      await prisma.myListItem.deleteMany({
        where: { profileId: req.params['profileId'], contentId: req.params['contentId'] },
      })
      res.json({ message: 'Removed from list' })
    } catch (err) {
      next(err)
    }
  }
)
