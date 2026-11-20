import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { AppError } from '../../common/app-error'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { ZodPipe } from '../../common/zod.pipe'
import { SessionsService } from '../sessions/sessions.service'
import { PlaybackService } from './playback.service'

const TokenBody = z
  .object({
    profileId: z.string().optional(),
    deviceId: z.string().optional(),
    episodeId: z.string().optional(),
    region: z.string().optional(),
  })
  .optional()

const QoeBody = z.object({
  contentId: z.string(),
  eventType: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Static routes are declared before `:contentId` so `qoe`/`sessions`/`drm` are never captured by it.
@Controller('api/v1/playback')
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  constructor(
    @Inject(PlaybackService) private readonly playback: PlaybackService,
    @Inject(SessionsService) private readonly sessions: SessionsService
  ) {}

  @Post('sessions/:sessionId/heartbeat')
  @HttpCode(200)
  async heartbeat(@Param('sessionId') sessionId: string, @UserId() userId: string) {
    const ok = await this.sessions.heartbeat(sessionId, userId)
    if (!ok) throw new AppError(404, 'Session not found')
    return { data: { ok: true } }
  }

  @Post('qoe')
  @HttpCode(200)
  async qoe(@UserId() userId: string, @Body(new ZodPipe(QoeBody)) body: z.infer<typeof QoeBody>) {
    await this.playback.recordQoEEvent(userId, body.contentId, body.eventType, body.metadata)
    return { data: { recorded: true } }
  }

  @Get('drm/:provider/:contentId')
  drm(@Param('provider') provider: string, @Param('contentId') contentId: string) {
    return {
      data: { licenseUrl: `/api/v1/playback/drm/license/${provider}/${contentId}`, provider },
    }
  }

  @Post(':contentId')
  @HttpCode(200)
  async token(
    @Param('contentId') contentId: string,
    @UserId() userId: string,
    @Body(new ZodPipe(TokenBody)) body: z.infer<typeof TokenBody>
  ) {
    return { data: await this.playback.issuePlaybackToken(userId, contentId, body ?? {}) }
  }
}
