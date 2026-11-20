import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

import { eq, watchHistory } from '@netflix/db'

async function setup() {
  const u = await t.seedUser()
  const p = await t.seedProfile(u.id)
  return { u, p, token: await t.token(u.id) }
}

describe('watch history routes', () => {
  it('requires authentication and ownership', async () => {
    const { p, token } = await setup()
    expect((await t.request('GET', `/api/profiles/${p.id}/history`)).status).toBe(401)
    const other = await t.seedUser()
    const op = await t.seedProfile(other.id)
    const c = await t.seedContent()
    expect((await t.request('GET', `/api/profiles/${op.id}/history`, { token })).status).toBe(403)
    expect(
      (
        await t.request('PUT', `/api/profiles/${op.id}/history`, {
          token,
          body: { contentId: c.id, progress: 0.5 },
        })
      ).status
    ).toBe(403)
  })

  it('PUT upserts progress per profile+content', async () => {
    const { p, token } = await setup()
    const c = await t.seedContent()
    const url = `/api/profiles/${p.id}/history`
    const first = await t.request('PUT', url, { token, body: { contentId: c.id, progress: 0.2 } })
    expect(first.status).toBe(200)
    expect(first.body.data.progress).toBe(0.2)
    const second = await t.request('PUT', url, { token, body: { contentId: c.id, progress: 0.9 } })
    expect(second.body.data.progress).toBe(0.9)
    expect(second.body.data.id).toBe(first.body.data.id)
    expect(
      await t.db.select().from(watchHistory).where(eq(watchHistory.profileId, p.id))
    ).toHaveLength(1)
  })

  it('GET returns only progress > 0.05, newest first, with content and genres, max 20', async () => {
    const { p, token } = await setup()
    const barely = await t.seedContent({ title: 'Barely' })
    const older = await t.seedContent({ title: 'Older', genres: ['Drama'] })
    const newer = await t.seedContent({ title: 'Newer' })
    await t.db.insert(watchHistory).values([
      { profileId: p.id, contentId: barely.id, progress: 0.05 },
      { profileId: p.id, contentId: older.id, progress: 0.3, updatedAt: new Date('2024-01-01') },
      { profileId: p.id, contentId: newer.id, progress: 0.6, updatedAt: new Date('2024-06-01') },
    ])
    const res = await t.request('GET', `/api/v1/profiles/${p.id}/history`, { token })
    expect(res.status).toBe(200)
    expect(res.body.data.map((h: { content: { title: string } }) => h.content.title)).toEqual([
      'Newer',
      'Older',
    ])
    expect(res.body.data[1].content.genres[0].genre.name).toBe('Drama')
  })

  it('GET caps the list at 20 entries', async () => {
    const { p, token } = await setup()
    for (let i = 0; i < 22; i++) {
      const c = await t.seedContent()
      await t.db.insert(watchHistory).values({ profileId: p.id, contentId: c.id, progress: 0.5 })
    }
    const res = await t.request('GET', `/api/profiles/${p.id}/history`, { token })
    expect(res.body.data).toHaveLength(20)
  })
})
