import { Body, Controller, Delete, Get, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { MyListService } from './my-list.service'

@Controller(['api/profiles', 'api/v1/profiles'])
@UseGuards(JwtAuthGuard)
export class MyListController {
  constructor(@Inject(MyListService) private readonly myList: MyListService) {}

  @Get(':profileId/my-list')
  async list(@UserId() userId: string, @Param('profileId') profileId: string) {
    return { data: await this.myList.list(userId, profileId) }
  }

  @Post(':profileId/my-list')
  async add(
    @UserId() userId: string,
    @Param('profileId') profileId: string,
    @Body() body: { contentId: string }
  ) {
    return { data: await this.myList.add(userId, profileId, body?.contentId as string) }
  }

  @Delete(':profileId/my-list/:contentId')
  async remove(
    @UserId() userId: string,
    @Param('profileId') profileId: string,
    @Param('contentId') contentId: string
  ) {
    await this.myList.remove(userId, profileId, contentId)
    return { message: 'Removed from list' }
  }
}
