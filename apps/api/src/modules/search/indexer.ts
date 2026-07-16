import { prisma } from '@netflix/db'
import { getRedis } from '../../lib/redis'
import { filterByKidProfile } from '../../lib/maturity'

const SEARCH_INDEX = 'catalog:search'

export async function indexContent(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { genres: { include: { genre: true } } },
  })
  if (!content) return

  const doc = JSON.stringify({
    id: content.id,
    title: content.title,
    description: content.description,
    mediaType: content.mediaType,
    maturityRating: content.maturityRating,
    genres: content.genres.map((g) => g.genre.name),
  })

  const redis = await getRedis()
  await redis.set(`${SEARCH_INDEX}:${contentId}`, doc)
}

export async function searchCatalog(query: string, isKid = false) {
  const redis = await getRedis()
  const keys = await redis.keys(`${SEARCH_INDEX}:*`)
  const results: Array<{
    id: string
    title: string
    description: string
    mediaType: string
    maturityRating: string
  }> = []

  const q = query.toLowerCase()
  for (const key of keys) {
    const raw = await redis.get(key)
    if (!raw) continue
    const doc = JSON.parse(raw) as {
      id: string
      title: string
      description: string
      mediaType: string
      maturityRating: string
    }
    if (doc.title.toLowerCase().includes(q) || doc.description.toLowerCase().includes(q)) {
      results.push(doc)
    }
  }

  return filterByKidProfile(results, isKid).slice(0, 30)
}

export async function processOutboxBatch(limit = 50) {
  const events = await prisma.outboxEvent.findMany({
    where: { processedAt: null },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  for (const event of events) {
    if (event.eventType.startsWith('content.')) {
      await indexContent(event.aggregateId)
    }
    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    })
  }

  return events.length
}

export async function reindexAllContent() {
  const contents = await prisma.content.findMany({ where: { status: 'PUBLISHED' } })
  for (const c of contents) {
    await indexContent(c.id)
  }
  return contents.length
}
