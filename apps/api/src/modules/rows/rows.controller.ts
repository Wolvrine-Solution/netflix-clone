import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { OptionalAuthGuard } from '../../common/auth.guard'
import { IsKid } from '../../common/decorators'
import { KidProfileGuard } from '../../common/kid-profile.guard'
import { RowsService } from './rows.service'

@Controller(['api/rows', 'api/v1/rows'])
@UseGuards(OptionalAuthGuard, KidProfileGuard)
export class RowsController {
  constructor(@Inject(RowsService) private readonly rows: RowsService) {}

  @Get()
  async list(@IsKid() kid: boolean) {
    return { data: await this.rows.list(kid) }
  }
}
