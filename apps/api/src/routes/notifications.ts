import { Router } from 'express'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../middleware/authenticate'

export const notificationsRouter = Router()
notificationsRouter.use(authenticate)

notificationsRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    res.json({ data: notifications })
  } catch (err) { next(err) }
})

notificationsRouter.patch('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params['id'], userId: req.userId! },
      data: { read: true },
    })
    res.json({ message: 'Marked as read' })
  } catch (err) { next(err) }
})

notificationsRouter.post('/read-all', async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, read: false },
      data: { read: true },
    })
    res.json({ message: 'All notifications marked as read' })
  } catch (err) { next(err) }
})
