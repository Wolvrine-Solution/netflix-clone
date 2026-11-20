import { Module } from '@nestjs/common'
import { AdminLogService } from './admin-log.service'
import { AdminAnalyticsController } from './analytics/admin-analytics.controller'
import { AdminContentController } from './content/admin-content.controller'
import { AdminContentService } from './content/admin-content.service'
import { AdminGenresController } from './genres/admin-genres.controller'
import { AdminMfaController } from './mfa/admin-mfa.controller'
import { AdminNotificationsController } from './notifications/admin-notifications.controller'
import { AdminRowsController } from './rows/admin-rows.controller'
import { AdminUsersController } from './users/admin-users.controller'

/** Admin API, mounted at /api/admin/* only (not under /api/v1). */
@Module({
  controllers: [
    AdminMfaController,
    AdminContentController,
    AdminRowsController,
    AdminUsersController,
    AdminGenresController,
    AdminAnalyticsController,
    AdminNotificationsController,
  ],
  providers: [AdminLogService, AdminContentService],
})
export class AdminModule {}
