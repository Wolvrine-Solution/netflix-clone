import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'

export const adminNotificationsRouter = Router()
adminNotificationsRouter.use(authenticate, adminOnly)

const broadcastSchema = z.object({
  type: z.enum(['NEW_CONTENT', 'SUBSCRIPTION', 'SYSTEM', 'GENERAL', 'PROMO', 'ACCOUNT']).default('GENERAL'),
  title: z.string().min(1),
  message: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  link: z.string().optional(),
  imageUrl: z.string().optional(),
  userIds: z.array(z.string()).optional(),
}).refine((d) => d.message || d.body, { message: 'message or body is required' })

adminNotificationsRouter.post('/broadcast', validate(broadcastSchema), async (req, res, next) => {
  try {
    const { userIds, body, message, ...rest } = req.body as z.infer<typeof broadcastSchema>
    const notifData = { ...rest, message: message ?? body ?? '' }
    const targetUsers = userIds?.length
      ? userIds
      : (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id)

    await prisma.notification.createMany({
      data: targetUsers.map((userId) => ({ userId, ...notifData })),
    })
    res.json({ message: `Notification sent to ${targetUsers.length} users` })
  } catch (err) { next(err) }
})
