import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { assertProfileOwned } from '../../common/profile-access'
import { DB } from '../../common/tokens'
import type { Database } from '@netflix/db'
import { RecommendationsService } from './recommendations.service'

@Controller('api/v1/recommendations')
export class RecommendationsController {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(RecommendationsService) private readonly recs: RecommendationsService
  ) {}

  @Get(':profileId')
  @UseGuards(JwtAuthGuard)
  async get(@Param('profileId') profileId: string, @UserId() userId: string) {
    await assertProfileOwned(this.db, profileId, userId)
    return { data: await this.recs.forProfile(profileId) }
  }
}
