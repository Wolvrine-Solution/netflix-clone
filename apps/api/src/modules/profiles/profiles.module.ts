import { Module } from '@nestjs/common'
import { MyListController } from './my-list.controller'
import { MyListService } from './my-list.service'
import { ProfilesController } from './profiles.controller'
import { ProfilesService } from './profiles.service'
import { WatchHistoryController } from './watch-history.controller'
import { WatchHistoryService } from './watch-history.service'

@Module({
  controllers: [ProfilesController, MyListController, WatchHistoryController],
  providers: [ProfilesService, MyListService, WatchHistoryService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
