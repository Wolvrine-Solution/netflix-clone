import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common'
import { AppError } from '../../common/app-error'
import { OptionalAuthGuard } from '../../common/auth.guard'
import { IsKid } from '../../common/decorators'
import { KidProfileGuard } from '../../common/kid-profile.guard'
import { filterByKidProfile } from '../../common/maturity'
import { ContentService } from './content.service'

@Controller(['api/content', 'api/v1/content'])
@UseGuards(OptionalAuthGuard, KidProfileGuard)
export class ContentController {
  constructor(@Inject(ContentService) private readonly content: ContentService) {}

  @Get()
  async list(
    @IsKid() kid: boolean,
    @Query() query: { mediaType?: 'movie' | 'tv'; genre?: string; page?: string; limit?: string }
  ) {
    const page = parseInt(query.page ?? '1')
    const limit = parseInt(query.limit ?? '20')
    const { items, total } = await this.content.list({
      mediaType: query.mediaType,
      genre: query.genre,
      page,
      limit,
      kid,
    })
    return { data: items, page, totalPages: Math.ceil(total / limit), totalResults: total }
  }

  @Get('featured')
  async featured(@IsKid() kid: boolean) {
    return { data: (await this.content.featured(kid)) ?? null }
  }

  @Get(':id')
  async byId(@Param('id') id: string, @IsKid() kid: boolean) {
    const item = await this.content.findById(id)
    if (!item) throw new AppError(404, 'Content not found')
    if (kid) {
      const [filtered] = filterByKidProfile([item], true)
      if (!filtered) throw new AppError(403, 'Content not available for kid profiles')
      return { data: filtered }
    }
    return { data: item }
  }
}
