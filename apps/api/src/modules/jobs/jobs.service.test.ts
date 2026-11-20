import { describe, expect, it, vi } from 'vitest'
import { JobsService } from './jobs.service'
import type { ComplianceService } from '../compliance/compliance.service'
import type { SearchIndexerService } from '../search/search-indexer.service'

function build(c: Partial<ComplianceService>, s: Partial<SearchIndexerService>) {
  return new JobsService(c as ComplianceService, s as SearchIndexerService)
}

describe('JobsService.runBackgroundJobs', () => {
  it('runs license unpublish then the search outbox', async () => {
    const order: string[] = []
    const svc = build(
      {
        unpublishExpiredLicenses: vi.fn(async () => {
          order.push('licenses')
          return 0
        }),
      },
      {
        processOutboxBatch: vi.fn(async () => {
          order.push('outbox')
        }) as never,
      }
    )
    await svc.runBackgroundJobs()
    expect(order).toEqual(['licenses', 'outbox'])
  })

  it('swallows errors so the interval keeps running', async () => {
    const outbox = vi.fn()
    const svc = build(
      { unpublishExpiredLicenses: vi.fn().mockRejectedValue(new Error('db down')) },
      { processOutboxBatch: outbox as never }
    )
    await expect(svc.runBackgroundJobs()).resolves.toBeUndefined()
    expect(outbox).not.toHaveBeenCalled()
  })
})
