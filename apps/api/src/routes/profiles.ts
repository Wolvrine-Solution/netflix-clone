import { Router } from 'express'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { AppError } from '../middleware/errorHandler'

export const profilesRouter = Router()

profilesRouter.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profiles = await prisma.profile.findMany({ where: { userId: req.userId } })
    res.json({ data: profiles })
  } catch (err) {
    next(err)
  }
})

profilesRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, avatarUrl, isKid = false } = req.body as { name: string; avatarUrl: string; isKid?: boolean }
    const count = await prisma.profile.count({ where: { userId: req.userId } })
    if (count >= 5) throw new AppError(400, 'Maximum 5 profiles allowed')
    const profile = await prisma.profile.create({
      data: { name, avatarUrl, isKid, userId: req.userId! },
    })
    res.status(201).json({ data: profile })
  } catch (err) {
    next(err)
  }
})

profilesRouter.put('/:profileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, avatarUrl, isKid } = req.body as { name?: string; avatarUrl?: string; isKid?: boolean }
    const profile = await prisma.profile.findFirst({
      where: { id: req.params['profileId'], userId: req.userId },
    })
    if (!profile) throw new AppError(404, 'Profile not found')
    const updated = await prisma.profile.update({
      where: { id: req.params['profileId'] },
      data: { ...(name && { name }), ...(avatarUrl && { avatarUrl }), ...(isKid !== undefined && { isKid }) },
    })
    res.json({ data: updated })
  } catch (err) {
    next(err)
  }
})

profilesRouter.delete('/:profileId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profile = await prisma.profile.findFirst({
      where: { id: req.params['profileId'], userId: req.userId },
    })
    if (!profile) throw new AppError(404, 'Profile not found')
    await prisma.profile.delete({ where: { id: req.params['profileId'] } })
    res.json({ message: 'Profile deleted' })
  } catch (err) {
    next(err)
  }
})
