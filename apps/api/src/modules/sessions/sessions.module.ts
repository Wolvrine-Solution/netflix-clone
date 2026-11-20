import { Module } from '@nestjs/common'
import { EntitlementsModule } from '../entitlements/entitlements.module'
import { SessionsService } from './sessions.service'

@Module({
  imports: [EntitlementsModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
