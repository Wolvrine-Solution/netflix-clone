import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'
import { AppError } from '../../middleware/errorHandler'

export const adminUsersRouter = Router()
adminUsersRouter.use(authenticate, adminOnly)

adminUsersRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query['page'] ?? '1')))
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '20'))))
    const q = String(req.query['q'] ?? '').trim()

    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { name: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { subscription: true, _count: { select: { profiles: true } } },
      }),
      prisma.user.count({ where }),
    ])

    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      image: u.image,
      role: u.role,
      isSuspended: u.isSuspended,
      createdAt: u.createdAt,
      profileCount: u._count.profiles,
      subscription: u.subscription
        ? { plan: u.subscription.plan, status: u.subscription.status }
        : null,
    }))

    res.json({ data, page, totalPages: Math.ceil(total / limit), totalResults: total })
  } catch (err) {
    next(err)
  }
})

adminUsersRouter.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params['id'] },
      include: {
        subscription: true,
        profiles: true,
        _count: { select: { profiles: true } },
      },
    })
    if (!user) throw new AppError(404, 'User not found')
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

const updateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isSuspended: z.boolean().optional(),
  name: z.string().optional(),
})

adminUsersRouter.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params['id'] },
      data: req.body as z.infer<typeof updateSchema>,
    })
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

adminUsersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params['id']!
    await prisma.user.delete({ where: { id } })
    res.json({ message: 'User deleted' })
  } catch (err) {
    next(err)
  }
})

// Reset subscription
adminUsersRouter.post('/:id/subscription', async (req, res, next) => {
  try {
    const { plan, status } = req.body as {
      plan: 'BASIC' | 'STANDARD' | 'PREMIUM'
      status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE'
    }
    const sub = await prisma.subscription.upsert({
      where: { userId: req.params['id'] },
      update: { plan, status },
      create: { userId: req.params['id']!, plan, status },
    })
    res.json({ data: sub })
  } catch (err) {
    next(err)
  }
})
