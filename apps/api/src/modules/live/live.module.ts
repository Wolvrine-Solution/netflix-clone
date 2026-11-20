import { Module } from '@nestjs/common'
import { PlaybackModule } from '../playback/playback.module'
import { LiveController } from './live.controller'
import { LiveService } from './live.service'

@Module({
  imports: [PlaybackModule],
  controllers: [LiveController],
  providers: [LiveService],
  exports: [LiveService],
})
export class LiveModule {}
