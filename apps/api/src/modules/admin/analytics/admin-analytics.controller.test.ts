import { adminLog, myListItem, subscription, watchHistory } from '@netflix/db'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../../test/harness'
import { adminAuth } from '../admin.test-utils'

let t: TestApp
let token: string
let adminId: string
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(async () => {
  await t.reset()
  const a = await adminAuth(t)
  token = a.token
  adminId = a.admin.id
})
const get = (url: string) => t.request('GET', `/api/admin/analytics${url}`, { token })

describe('GET /dashboard', () => {
  it('aggregates counts, average rating, revenue estimate and media split', async () => {
    const u = await t.seedUser()
    const p = await t.seedProfile(u.id)
    const m = await t.seedContent({ mediaType: 'movie', rating: 8 })
    await t.seedContent({ mediaType: 'tv', rating: 6 })
    await t.seedContent({ mediaType: 'tv', rating: 7, status: 'DRAFT' })
    await t.db.insert(subscription).values({ userId: u.id, status: 'ACTIVE' })
    await t.db.insert(watchHistory).values({ profileId: p.id, contentId: m.id, progress: 0.5 })
    await t.db.insert(myListItem).values({ profileId: p.id, contentId: m.id })

    const res = await get('/dashboard')
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      totalContent: 2,
      totalUsers: 2,
      totalProfiles: 1,
      activeSubscriptions: 1,
      totalRevenue: 13.99,
      totalWatchEvents: 1,
      totalMyListAdds: 1,
      avgRating: 7,
      contentByType: { movie: 1, tv: 2 },
      newUsersThisMonth: 2,
      newContentThisMonth: 3,
    })
  })

  it('works on an empty catalog', async () => {
    const res = await get('/dashboard')
    expect(res.body.data).toMatchObject({
      totalContent: 0,
      avgRating: 0,
      contentByType: { movie: 0, tv: 0 },
    })
  })
})

describe('GET /top-content', () => {
  it('ranks by watch count with average progress and my-list counts', async () => {
    const u = await t.seedUser()
    const p1 = await t.seedProfile(u.id)
    const p2 = await t.seedProfile(u.id)
    const hot = await t.seedContent({ title: 'Hot' })
    const cold = await t.seedContent({ title: 'Cold' })
    await t.db.insert(watchHistory).values([
      { profileId: p1.id, contentId: hot.id, progress: 0.5 },
      { profileId: p2.id, contentId: hot.id, progress: 1 },
      { profileId: p1.id, contentId: cold.id, progress: 0.2 },
    ])
    await t.db.insert(myListItem).values({ profileId: p1.id, contentId: hot.id })

    const res = await get('/top-content')
    expect(res.status).toBe(200)
    expect(res.body.data[0]).toMatchObject({
      contentId: hot.id,
      title: 'Hot',
      watchCount: 2,
      avgProgress: 75,
      myListCount: 1,
    })
    expect(res.body.data[1]).toMatchObject({
      title: 'Cold',
      watchCount: 1,
      avgProgress: 20,
      myListCount: 0,
    })
    expect((await get('/top-content?limit=1')).body.data).toHaveLength(1)
  })

  it('returns an empty list with no watch history', async () => {
    expect((await get('/top-content')).body.data).toEqual([])
  })
})

describe('GET /user-growth', () => {
  it("returns 30 daily buckets ending today with today's signups counted", async () => {
    await t.seedUser()
    const res = await get('/user-growth')
    expect(res.body.data).toHaveLength(30)
    const today = new Date().toISOString().split('T')[0]
    const last = res.body.data[29]
    expect(last.date).toBe(today)
    expect(last.value).toBe(2) // admin + seeded user
    expect(res.body.data[0].value).toBe(0)
  })
})

describe('GET /recent-logs', () => {
  it('returns newest logs first with admin name/email and honours limit', async () => {
    await t.db
      .insert(adminLog)
      .values({ adminId, action: 'A', resource: 'R', createdAt: new Date(1000) })
    await t.db
      .insert(adminLog)
      .values({ adminId, action: 'B', resource: 'R', createdAt: new Date(2000) })
    const res = await get('/recent-logs')
    expect(res.body.data.map((l: { action: string }) => l.action)).toEqual(['B', 'A'])
    expect(res.body.data[0].admin).toHaveProperty('email')
    expect((await get('/recent-logs?limit=1')).body.data).toHaveLength(1)
  })
})
