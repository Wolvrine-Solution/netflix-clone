import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, outboxEvent } from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'
import { SearchIndexerService } from './search-indexer.service'

let t: TestApp
let indexer: SearchIndexerService
beforeAll(async () => {
  t = await createTestApp()
  indexer = t.app.get(SearchIndexerService)
})
afterAll(() => t.close())
beforeEach(async () => {
  await t.reset()
  const redis = (
    indexer as unknown as {
      redis: { keys(p: string): Promise<string[]>; del(...k: string[]): Promise<number> }
    }
  ).redis
  const keys = await redis.keys('catalog:search:*')
  if (keys.length) await redis.del(...keys)
})

describe('SearchIndexerService', () => {
  it('indexes content and finds it by title or description', async () => {
    const c = await t.seedContent({
      title: 'Blade Runner',
      description: 'neon noir',
      maturityRating: 'R',
    })
    await indexer.indexContent(c.id)
    expect((await indexer.searchCatalog('blade')).map((d) => d.id)).toEqual([c.id])
    expect((await indexer.searchCatalog('NEON')).map((d) => d.id)).toEqual([c.id])
    expect(await indexer.searchCatalog('absent')).toEqual([])
  })

  it('ignores unknown content ids', async () => {
    await indexer.indexContent('missing')
    expect(await indexer.searchCatalog('anything')).toEqual([])
  })

  it('filters to kid-safe ratings for kid searches', async () => {
    const a = await t.seedContent({ title: 'Cartoon', maturityRating: 'TV-Y' })
    const b = await t.seedContent({ title: 'Cartoon Horror', maturityRating: 'R' })
    await indexer.indexContent(a.id)
    await indexer.indexContent(b.id)
    expect((await indexer.searchCatalog('cartoon', true)).map((d) => d.id)).toEqual([a.id])
    expect(await indexer.searchCatalog('cartoon', false)).toHaveLength(2)
  })

  it('processes content.* outbox events oldest first, marks them done, skips others', async () => {
    const c = await t.seedContent({ title: 'Outbox Movie' })
    const [e1] = await t.db
      .insert(outboxEvent)
      .values({
        aggregateType: 'content',
        aggregateId: c.id,
        eventType: 'content.published',
        payload: {},
        createdAt: new Date(Date.now() - 1000),
      })
      .returning()
    const [e2] = await t.db
      .insert(outboxEvent)
      .values({
        aggregateType: 'user',
        aggregateId: 'u1',
        eventType: 'user.created',
        payload: {},
      })
      .returning()
    await t.db.insert(outboxEvent).values({
      aggregateType: 'content',
      aggregateId: c.id,
      eventType: 'content.updated',
      payload: {},
      processedAt: new Date(),
    })

    expect(await indexer.processOutboxBatch()).toBe(2)
    expect((await indexer.searchCatalog('outbox')).map((d) => d.id)).toEqual([c.id])
    for (const id of [e1!.id, e2!.id]) {
      const [row] = await t.db.select().from(outboxEvent).where(eq(outboxEvent.id, id))
      expect(row!.processedAt).toBeInstanceOf(Date)
    }
    expect(await indexer.processOutboxBatch()).toBe(0)
  })

  it('honours the batch limit', async () => {
    for (let i = 0; i < 3; i++)
      await t.db
        .insert(outboxEvent)
        .values({ aggregateType: 'x', aggregateId: `a${i}`, eventType: 'other', payload: {} })
    expect(await indexer.processOutboxBatch(2)).toBe(2)
    expect(await indexer.processOutboxBatch(2)).toBe(1)
  })

  it('reindexes all published content only', async () => {
    await t.seedContent({ title: 'Live One' })
    await t.seedContent({ title: 'Draft One', status: 'DRAFT' })
    expect(await indexer.reindexAllContent()).toBe(1)
    expect(await indexer.searchCatalog('one')).toHaveLength(1)
  })
})
