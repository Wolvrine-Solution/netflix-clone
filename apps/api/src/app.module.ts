import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AllExceptionsFilter } from './common/all-exceptions.filter'
import { CoreModule } from './common/core.module'
import { genRequestId } from './common/request-id'
import { DbModule } from './db/db.module'
import { HealthModule } from './health/health.module'
import { AdminModule } from './modules/admin/admin.module'
import { AssetsModule } from './modules/assets/assets.module'
import { AuthModule } from './modules/auth/auth.module'
import { BillingModule } from './modules/billing/billing.module'
import { ComplianceModule } from './modules/compliance/compliance.module'
import { ContentModule } from './modules/content/content.module'
import { EntitlementsModule } from './modules/entitlements/entitlements.module'
import { JobsModule } from './modules/jobs/jobs.module'
import { LiveModule } from './modules/live/live.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { PlaybackModule } from './modules/playback/playback.module'
import { ProfilesModule } from './modules/profiles/profiles.module'
import { RecommendationsModule } from './modules/recommendations/recommendations.module'
import { ReviewsModule } from './modules/reviews/reviews.module'
import { RowsModule } from './modules/rows/rows.module'
import { SearchModule } from './modules/search/search.module'
import { SessionsModule } from './modules/sessions/sessions.module'

const isProd = process.env['NODE_ENV'] === 'production'
const isTest = process.env['NODE_ENV'] === 'test'

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: isTest ? 'silent' : isProd ? 'info' : 'debug',
        genReqId: (req) => genRequestId(req),
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/ready' },
        transport:
          process.env['NODE_ENV'] === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1000, limit: 200 }]),
    ScheduleModule.forRoot(),
    DbModule,
    CoreModule,
    HealthModule,
    AuthModule,
    ContentModule,
    RowsModule,
    SearchModule,
    ProfilesModule,
    NotificationsModule,
    ReviewsModule,
    AdminModule,
    PlaybackModule,
    BillingModule,
    AssetsModule,
    LiveModule,
    ComplianceModule,
    RecommendationsModule,
    SessionsModule,
    EntitlementsModule,
    JobsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
