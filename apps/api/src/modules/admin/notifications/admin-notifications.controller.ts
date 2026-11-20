import { Body, Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { notification, user, type Database } from '@netflix/db'
import { AdminGuard } from '../../../common/admin.guard'
import { DB } from '../../../common/tokens'
import { ZodPipe } from '../../../common/zod.pipe'

const broadcastSchema = z
  .object({
    type: z
      .enum(['NEW_CONTENT', 'SUBSCRIPTION', 'SYSTEM', 'GENERAL', 'PROMO', 'ACCOUNT'])
      .default('GENERAL'),
    title: z.string().min(1),
    message: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    link: z.string().optional(),
    imageUrl: z.string().optional(),
    userIds: z.array(z.string()).optional(),
  })
  .refine((d) => d.message || d.body, { message: 'message or body is required' })

const CHUNK = 1000

@Controller('api/admin/notifications')
@UseGuards(AdminGuard)
export class AdminNotificationsController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Post('broadcast')
  @HttpCode(200)
  async broadcast(@Body(new ZodPipe(broadcastSchema)) input: z.infer<typeof broadcastSchema>) {
    const { userIds, body, message, ...rest } = input
    const data = { ...rest, message: message ?? body ?? '' }
    const targets = userIds?.length
      ? userIds
      : (await this.db.select({ id: user.id }).from(user)).map((u) => u.id)

    for (let i = 0; i < targets.length; i += CHUNK) {
      await this.db
        .insert(notification)
        .values(targets.slice(i, i + CHUNK).map((userId) => ({ userId, ...data })))
    }
    return { message: `Notification sent to ${targets.length} users` }
  }
}
