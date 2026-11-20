import { Module } from '@nestjs/common'
import { ComplianceModule } from '../compliance/compliance.module'
import { SearchModule } from '../search/search.module'
import { JobsService } from './jobs.service'

@Module({ imports: [ComplianceModule, SearchModule], providers: [JobsService] })
export class JobsModule {}
