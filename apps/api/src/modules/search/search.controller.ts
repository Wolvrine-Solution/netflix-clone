import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { OptionalAuthGuard } from '../../common/auth.guard'
import { IsKid } from '../../common/decorators'
import { KidProfileGuard } from '../../common/kid-profile.guard'
import { SearchService } from './search.service'

@Controller(['api/search', 'api/v1/search'])
@UseGuards(OptionalAuthGuard, KidProfileGuard)
export class SearchController {
  constructor(@Inject(SearchService) private readonly search: SearchService) {}

  @Get()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async find(@Query('q') q: string | undefined, @IsKid() kid: boolean) {
    const term = q ?? ''
    if (!term || term.trim().length < 2) return { data: [] }
    return { data: await this.search.search(term, kid) }
  }
}
