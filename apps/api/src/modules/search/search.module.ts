import { Module } from '@nestjs/common'
import { ContentModule } from '../content/content.module'
import { SearchController } from './search.controller'
import { SearchIndexerService } from './search-indexer.service'
import { SearchService } from './search.service'

@Module({
  imports: [ContentModule],
  controllers: [SearchController],
  providers: [SearchService, SearchIndexerService],
  exports: [SearchIndexerService],
})
export class SearchModule {}
