import { Controller, Get, HttpCode, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { NotificationsService } from './notifications.service'

@Controller(['api/notifications', 'api/v1/notifications'])
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  @Get()
  async list(@UserId() userId: string) {
    return { data: await this.notifications.list(userId) }
  }

  @Patch(':id/read')
  async markRead(@UserId() userId: string, @Param('id') id: string) {
    await this.notifications.markRead(userId, id)
    return { message: 'Marked as read' }
  }

  @Post('read-all')
  @HttpCode(200)
  async markAllRead(@UserId() userId: string) {
    await this.notifications.markAllRead(userId)
    return { message: 'All notifications marked as read' }
  }
}
