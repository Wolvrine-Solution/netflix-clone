import { Inject, Injectable } from '@nestjs/common'
import { and, asc, eq, isNull, outboxEvent, content, type Database } from '@netflix/db'
import { filterByKidProfile } from '../../common/maturity'
import { DB, REDIS } from '../../common/tokens'
import type { getRedis } from '../../lib/redis'

type Redis = Awaited<ReturnType<typeof getRedis>>

const SEARCH_INDEX = 'catalog:search'

export interface IndexedDoc {
  id: string
  title: string
  description: string
  mediaType: string
  maturityRating: string
}

/** Redis-backed catalog index fed by outbox events (Meilisearch replaces it in Phase 6). */
@Injectable()
export class SearchIndexerService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis
  ) {}

  async indexContent(contentId: string): Promise<void> {
    const c = await this.db.query.content.findFirst({
      where: eq(content.id, contentId),
      with: { genres: { with: { genre: true } } },
    })
    if (!c) return
    const doc = JSON.stringify({
      id: c.id,
      title: c.title,
      description: c.description,
      mediaType: c.mediaType,
      maturityRating: c.maturityRating,
      genres: c.genres.map((g) => g.genre.name),
    })
    await this.redis.set(`${SEARCH_INDEX}:${contentId}`, doc)
  }

  async searchCatalog(query: string, isKid = false): Promise<IndexedDoc[]> {
    const keys = await this.redis.keys(`${SEARCH_INDEX}:*`)
    const q = query.toLowerCase()
    const results: IndexedDoc[] = []
    for (const key of keys) {
      const raw = await this.redis.get(key)
      if (!raw) continue
      const doc = JSON.parse(raw) as IndexedDoc
      if (doc.title.toLowerCase().includes(q) || doc.description.toLowerCase().includes(q)) {
        results.push(doc)
      }
    }
    return filterByKidProfile(results, isKid).slice(0, 30)
  }

  /** Index content for each unprocessed `content.*` outbox event; returns events handled. */
  async processOutboxBatch(limit = 50): Promise<number> {
    const events = await this.db
      .select()
      .from(outboxEvent)
      .where(isNull(outboxEvent.processedAt))
      .orderBy(asc(outboxEvent.createdAt))
      .limit(limit)

    for (const event of events) {
      if (event.eventType.startsWith('content.')) await this.indexContent(event.aggregateId)
      await this.db
        .update(outboxEvent)
        .set({ processedAt: new Date() })
        .where(and(eq(outboxEvent.id, event.id)))
    }
    return events.length
  }

  async reindexAllContent(): Promise<number> {
    const rows = await this.db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.status, 'PUBLISHED'))
    for (const r of rows) await this.indexContent(r.id)
    return rows.length
  }
}
