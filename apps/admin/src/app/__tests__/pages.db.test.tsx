// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createTestDb, type TestDb } from '@netflix/db/testing'

const holder = vi.hoisted(() => ({ db: undefined as unknown }))
vi.mock('@netflix/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@netflix/db')>()
  return { ...actual, db: new Proxy({}, { get: (_t, p) => Reflect.get(holder.db as object, p) }) }
})
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`)
  },
}))

import {
  adminLog,
  content,
  contentGenre,
  genre,
  myListItem,
  profile,
  subscription,
  user,
  videoFile,
  watchHistory,
} from '@netflix/db'
import AdminDashboard from '../page'
import ContentPage from '../content/page'
import ContentEditPage from '../content/[id]/page'
import UsersPage from '../users/page'
import AnalyticsPage from '../analytics/page'

let testDb: TestDb
let contentId: string

/** Collect every prop value reachable in a React element tree (cheap "did it render data" check). */
function text(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(text).join(' ')
  const el = node as { props?: Record<string, unknown> }
  return text(Object.values(el.props ?? {}))
}

beforeAll(async () => {
  testDb = await createTestDb()
  holder.db = testDb.db
  const db = testDb.db
  const [admin] = await db
    .insert(user)
    .values({ email: 'admin@test.dev', name: 'Admin One', role: 'ADMIN', hashedPassword: 'x' })
    .returning()
  const [member] = await db
    .insert(user)
    .values({ email: 'member@test.dev', name: 'Member', hashedPassword: 'x' })
    .returning()
  await db.insert(profile).values({ userId: member!.id, name: 'P1', avatarUrl: 'a' })
  await db.insert(subscription).values({ userId: member!.id, plan: 'PREMIUM', status: 'ACTIVE' })
  const [c] = await db
    .insert(content)
    .values({
      mediaType: 'movie',
      title: 'Dune Smoke',
      description: 'd',
      posterPath: 'p',
      backdropPath: 'b',
      releaseDate: '2024',
      rating: 8,
    })
    .returning()
  contentId = c!.id
  await db.insert(content).values({
    mediaType: 'tv',
    title: 'Show Smoke',
    description: 'd',
    posterPath: 'p',
    backdropPath: 'b',
    releaseDate: '2024',
    rating: 6,
    status: 'DRAFT',
  })
  await db.insert(genre).values({ id: 1, name: 'SciFi' })
  await db.insert(contentGenre).values({ contentId, genreId: 1 })
  await db.insert(videoFile).values({ contentId, url: 'v.mp4', size: 99n })
  await db.insert(adminLog).values({ adminId: admin!.id, action: 'CREATE', resource: 'content' })
  await db
    .insert(watchHistory)
    .values({ profileId: (await db.select().from(profile))[0]!.id, contentId })
  await db
    .insert(myListItem)
    .values({ profileId: (await db.select().from(profile))[0]!.id, contentId })
})
afterAll(() => testDb.close())

describe('admin pages run their ported Drizzle queries', () => {
  it('dashboard', async () => {
    const out = text(await AdminDashboard())
    expect(out).toContain('Dune Smoke')
    expect(out).toContain('Admin One')
  })

  it('content list, with and without filters', async () => {
    expect(text(await ContentPage({ searchParams: {} }))).toContain('Dune Smoke')
    const filtered = text(
      await ContentPage({ searchParams: { q: 'show', mediaType: 'tv', status: 'DRAFT' } })
    )
    expect(filtered).toContain('Show Smoke')
    expect(filtered).not.toContain('Dune Smoke')
  })

  it('content edit page serializes bigint file sizes and 404s on unknown ids', async () => {
    const out = (await ContentEditPage({ params: { id: contentId } })) as {
      props: { content: { videoFiles: { size: number }[] }; allGenres: unknown[] }
    }
    expect(out.props.content.videoFiles[0]!.size).toBe(99)
    expect(out.props.allGenres).toHaveLength(1)
    await expect(ContentEditPage({ params: { id: 'missing' } })).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('users list with search, role and status filters', async () => {
    expect(text(await UsersPage({ searchParams: {} }))).toContain('Member')
    const only = text(
      await UsersPage({ searchParams: { q: 'MEMBER', role: 'USER', status: 'active' } })
    )
    expect(only).toContain('member@test.dev')
    expect(only).not.toContain('admin@test.dev')
  })

  it('analytics aggregates', async () => {
    const out = (await AnalyticsPage()) as {
      props: {
        data: { kpis: Record<string, number>; topContentData: { views: number; title: string }[] }
      }
    }
    expect(out.props.data.kpis.totalUsers).toBe(2)
    expect(out.props.data.kpis.estimatedRevenue).toBeCloseTo(17.99)
    expect(out.props.data.topContentData[0]).toMatchObject({ title: 'Dune Smoke', views: 1 })
  })
})
