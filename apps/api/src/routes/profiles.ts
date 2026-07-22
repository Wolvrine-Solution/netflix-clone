import { Router } from 'express'
import { hash, compare } from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../middleware/authenticate'
import { validate } from '../middleware/validate'
import { AppError } from '../middleware/errorHandler'
import { assertProfileOwned } from '../lib/profileAccess'

export const profilesRouter = Router()

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4–6 digits'),
})

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
    const {
      name,
      avatarUrl,
      isKid = false,
    } = req.body as { name: string; avatarUrl: string; isKid?: boolean }
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
    const { name, avatarUrl, isKid } = req.body as {
      name?: string
      avatarUrl?: string
      isKid?: boolean
    }
    const profile = await prisma.profile.findFirst({
      where: { id: req.params['profileId'], userId: req.userId },
    })
    if (!profile) throw new AppError(404, 'Profile not found')
    const updated = await prisma.profile.update({
      where: { id: req.params['profileId'] },
      data: {
        ...(name && { name }),
        ...(avatarUrl && { avatarUrl }),
        ...(isKid !== undefined && { isKid }),
      },
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

profilesRouter.put(
  '/:profileId/pin',
  authenticate,
  validate(pinSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { pin } = req.body as z.infer<typeof pinSchema>
      const profile = await assertProfileOwned(req.params['profileId']!, req.userId!)
      const pinHash = await hash(pin, 10)
      const updated = await prisma.profile.update({
        where: { id: profile.id },
        data: { pinHash },
      })
      res.json({ data: { id: updated.id, hasPin: true } })
    } catch (err) {
      next(err)
    }
  }
)

profilesRouter.delete('/:profileId/pin', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const profile = await assertProfileOwned(req.params['profileId']!, req.userId!)
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: { pinHash: null },
    })
    res.json({ data: { id: updated.id, hasPin: false } })
  } catch (err) {
    next(err)
  }
})

profilesRouter.post(
  '/:profileId/pin/verify',
  authenticate,
  validate(pinSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { pin } = req.body as z.infer<typeof pinSchema>
      const profile = await assertProfileOwned(req.params['profileId']!, req.userId!)
      if (!profile.pinHash) throw new AppError(400, 'Profile has no PIN set')
      const valid = await compare(pin, profile.pinHash)
      if (!valid) throw new AppError(401, 'Invalid PIN')
      res.json({ data: { verified: true } })
    } catch (err) {
      next(err)
    }
  }
)

profilesRouter.post(
  '/:profileId/access',
  authenticate,
  validate(pinSchema.partial()),
  async (req: AuthRequest, res, next) => {
    try {
      const { pin } = req.body as { pin?: string }
      const profile = await assertProfileOwned(req.params['profileId']!, req.userId!)
      if (profile.pinHash) {
        if (!pin) throw new AppError(401, 'PIN required')
        const valid = await compare(pin, profile.pinHash)
        if (!valid) throw new AppError(401, 'Invalid PIN')
      }
      res.json({ data: { accessGranted: true } })
    } catch (err) {
      next(err)
    }
  }
)
