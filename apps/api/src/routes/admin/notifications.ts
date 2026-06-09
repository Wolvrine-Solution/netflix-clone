import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'

export const adminNotificationsRouter = Router()
adminNotificationsRouter.use(authenticate, adminOnly)

const broadcastSchema = z.object({
  type: z.enum(['NEW_CONTENT', 'SUBSCRIPTION', 'SYSTEM', 'GENERAL']).default('GENERAL'),
  title: z.string().min(1),
  message: z.string().min(1),
  link: z.string().optional(),
  imageUrl: z.string().optional(),
  userIds: z.array(z.string()).optional(), // empty = broadcast to all
})

adminNotificationsRouter.post('/broadcast', validate(broadcastSchema), async (req, res, next) => {
  try {
    const { userIds, ...notifData } = req.body as z.infer<typeof broadcastSchema>
    const targetUsers = userIds?.length
      ? userIds
      : (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id)

    await prisma.notification.createMany({
      data: targetUsers.map((userId) => ({ userId, ...notifData })),
    })
    res.json({ message: `Notification sent to ${targetUsers.length} users` })
  } catch (err) { next(err) }
})
