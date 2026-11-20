import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { z } from 'zod'
import { AppError } from '../../common/app-error'
import { AdminGuard } from '../../common/admin.guard'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { ZodPipe } from '../../common/zod.pipe'
import { PlaybackService } from '../playback/playback.service'
import { checkGeoRestriction, LiveService } from './live.service'

const CreateEventBody = z.object({
  channelId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  scheduledStart: z.iso.datetime(),
  scheduledEnd: z.iso.datetime().optional(),
  ingestUrl: z.string().optional(),
  playbackUrl: z.string().optional(),
})

@Controller('api/v1/live')
export class LiveController {
  constructor(
    @Inject(LiveService) private readonly live: LiveService,
    @Inject(PlaybackService) private readonly playback: PlaybackService
  ) {}

  @Get('channels')
  async channels() {
    return { data: await this.live.listChannels() }
  }

  @Get('events/:eventId')
  async event(@Param('eventId') eventId: string) {
    const event = await this.live.getEvent(eventId)
    if (!event) throw new AppError(404, 'Event not found')
    return { data: event }
  }

  @Post('events/:eventId/playback')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async eventPlayback(
    @Param('eventId') eventId: string,
    @UserId() userId: string,
    @Query('region') region?: string
  ) {
    const event = await this.live.getEvent(eventId)
    if (!event) throw new AppError(404, 'Event not found')
    if (!checkGeoRestriction(event, region)) throw new AppError(403, 'Geo-restricted')
    if (event.archivedContentId) {
      const token = await this.playback.issuePlaybackToken(userId, event.archivedContentId, {})
      return { data: { ...token, mode: 'dvr' } }
    }
    return {
      data: {
        manifestUrl: event.playbackUrl,
        mode: event.status === 'LIVE' ? 'live' : 'slate',
        slatePreUrl: event.slatePreUrl,
        slatePostUrl: event.slatePostUrl,
        dvrWindowSec: event.dvrWindowSec,
      },
    }
  }

  @Post('events')
  @UseGuards(AdminGuard)
  async create(@Body(new ZodPipe(CreateEventBody)) body: z.infer<typeof CreateEventBody>) {
    return { data: await this.live.createEvent(body) }
  }

  @Post('events/:eventId/archive')
  @HttpCode(200)
  @UseGuards(AdminGuard)
  async archive(@Param('eventId') eventId: string) {
    return { data: { contentId: await this.live.endAndArchive(eventId) } }
  }
}
