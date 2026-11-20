import { Body, Controller, Get, Inject, Param, Put, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { WatchHistoryService } from './watch-history.service'

@Controller(['api/profiles', 'api/v1/profiles'])
@UseGuards(JwtAuthGuard)
export class WatchHistoryController {
  constructor(@Inject(WatchHistoryService) private readonly history: WatchHistoryService) {}

  @Get(':profileId/history')
  async list(@UserId() userId: string, @Param('profileId') profileId: string) {
    return { data: await this.history.list(userId, profileId) }
  }

  @Put(':profileId/history')
  async record(
    @UserId() userId: string,
    @Param('profileId') profileId: string,
    @Body() body: { contentId: string; progress: number }
  ) {
    return {
      data: await this.history.record(
        userId,
        profileId,
        body?.contentId as string,
        body?.progress as number
      ),
    }
  }
}
