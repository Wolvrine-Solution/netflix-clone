import { Inject, Injectable } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { logger } from '../../lib/logger'
import { ComplianceService } from '../compliance/compliance.service'
import { SearchIndexerService } from '../search/search-indexer.service'

/** Periodic background work (replaces the old setInterval in index.ts). */
@Injectable()
export class JobsService {
  constructor(
    @Inject(ComplianceService) private readonly compliance: ComplianceService,
    @Inject(SearchIndexerService) private readonly indexer: SearchIndexerService
  ) {}

  @Interval(60_000)
  async runBackgroundJobs(): Promise<void> {
    try {
      await this.compliance.unpublishExpiredLicenses()
      await this.indexer.processOutboxBatch()
    } catch (err) {
      logger.warn({ err }, 'Background job error')
    }
  }
}
