import { Global, Module } from '@nestjs/common'
import { AdminMfaSessionService } from '../modules/auth/admin-mfa-session.service'
import { TokenService } from '../modules/auth/token.service'
import { getEnv } from '../config/env'
import { getRedis } from '../lib/redis'
import { ENV, REDIS } from './tokens'

/** Process-wide providers every feature module may inject. */
@Global()
@Module({
  providers: [
    { provide: ENV, useFactory: () => getEnv() },
    { provide: REDIS, useFactory: () => getRedis() },
    TokenService,
    AdminMfaSessionService,
  ],
  exports: [ENV, REDIS, TokenService, AdminMfaSessionService],
})
export class CoreModule {}
