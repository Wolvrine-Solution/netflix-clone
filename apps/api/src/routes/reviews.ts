import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { validate } from '../middleware/validate'

export const reviewsRouter = Router()
reviewsRouter.use(authenticate)

const reviewSchema = z.object({
  profileId: z.string().cuid(),
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(1000).optional(),
})

reviewsRouter.get('/:contentId', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { contentId: req.params['contentId'] },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { profile: { select: { name: true, avatarUrl: true } } },
    })
    res.json({ data: reviews })
  } catch (err) { next(err) }
})

reviewsRouter.post('/:contentId', validate(reviewSchema), async (req: AuthRequest, res, next) => {
  try {
    const { profileId, rating, comment } = req.body as z.infer<typeof reviewSchema>
    const review = await prisma.review.upsert({
      where: { profileId_contentId: { profileId, contentId: req.params['contentId']! } },
      update: { rating, comment },
      create: { profileId, contentId: req.params['contentId']!, userId: req.userId!, rating, comment },
    })
    res.status(201).json({ data: review })
  } catch (err) { next(err) }
})

reviewsRouter.delete('/:contentId', async (req: AuthRequest, res, next) => {
  try {
    const { profileId } = req.query as { profileId: string }
    await prisma.review.deleteMany({
      where: { contentId: req.params['contentId'], userId: req.userId!, profileId },
    })
    res.json({ message: 'Review deleted' })
  } catch (err) { next(err) }
})
