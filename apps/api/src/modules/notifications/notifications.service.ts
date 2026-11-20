import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq, notification, type Database } from '@netflix/db'
import { DB } from '../../common/tokens'

@Injectable()
export class NotificationsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list(userId: string) {
    return this.db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(desc(notification.createdAt))
      .limit(30)
  }

  async markRead(userId: string, id: string) {
    await this.db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.userId, userId), eq(notification.read, false)))
  }
}
