import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { watchHistory } from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

describe('GET /api/v1/recommendations/:profileId', () => {
  it('requires authentication', async () => {
    expect((await t.request('GET', '/api/v1/recommendations/p1')).status).toBe(401)
  })

  it('returns 403 when the profile belongs to another user', async () => {
    const owner = await t.seedUser()
    const other = await t.seedUser()
    const p = await t.seedProfile(owner.id)
    const res = await t.request('GET', `/api/v1/recommendations/${p.id}`, {
      token: await t.token(other.id),
    })
    expect(res.status).toBe(403)
  })

  it('falls back to featured content (best rated first) with no watch history', async () => {
    const u = await t.seedUser()
    const p = await t.seedProfile(u.id)
    await t.seedContent({ title: 'F-low', isFeatured: true, rating: 5 })
    await t.seedContent({ title: 'F-high', isFeatured: true, rating: 9 })
    await t.seedContent({ title: 'Plain' })
    await t.seedContent({ title: 'F-draft', isFeatured: true, status: 'DRAFT' })
    const res = await t.request('GET', `/api/v1/recommendations/${p.id}`, {
      token: await t.token(u.id),
    })
    expect(res.status).toBe(200)
    expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['F-high', 'F-low'])
  })

  it('recommends unwatched published content sharing genres, best rated first', async () => {
    const u = await t.seedUser()
    const p = await t.seedProfile(u.id)
    const watched = await t.seedContent({ title: 'Watched', genres: ['Drama'] })
    await t.seedContent({ title: 'Drama Hi', genres: ['Drama'], rating: 9 })
    await t.seedContent({ title: 'Drama Lo', genres: ['Drama'], rating: 4 })
    await t.seedContent({ title: 'Comedy', genres: ['Comedy'], rating: 10 })
    await t.seedContent({ title: 'Drama Draft', genres: ['Drama'], status: 'DRAFT' })
    await t.db.insert(watchHistory).values({ profileId: p.id, contentId: watched.id })

    const res = await t.request('GET', `/api/v1/recommendations/${p.id}`, {
      token: await t.token(u.id),
    })
    expect(res.status).toBe(200)
    expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['Drama Hi', 'Drama Lo'])
  })
})
