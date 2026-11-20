import { Module } from '@nestjs/common'
import { EntitlementsModule } from '../entitlements/entitlements.module'
import { SessionsModule } from '../sessions/sessions.module'
import { PlaybackController } from './playback.controller'
import { PlaybackService } from './playback.service'

@Module({
  imports: [SessionsModule, EntitlementsModule],
  controllers: [PlaybackController],
  providers: [PlaybackService],
  exports: [PlaybackService],
})
export class PlaybackModule {}
