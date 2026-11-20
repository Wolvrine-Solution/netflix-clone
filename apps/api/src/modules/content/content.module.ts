import { Module } from '@nestjs/common'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { TmdbService } from './tmdb.service'

@Module({
  controllers: [ContentController],
  providers: [ContentService, TmdbService],
  exports: [ContentService, TmdbService],
})
export class ContentModule {}
