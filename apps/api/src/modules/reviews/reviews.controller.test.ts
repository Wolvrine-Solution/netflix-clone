import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

import { eq, review } from '@netflix/db'

async function setup() {
  const u = await t.seedUser()
  const p = await t.seedProfile(u.id)
  const c = await t.seedContent()
  return { u, p, c, token: await t.token(u.id) }
}

describe('reviews routes', () => {
  it('all routes require authentication', async () => {
    const { c } = await setup()
    expect((await t.request('GET', `/api/reviews/${c.id}`)).status).toBe(401)
    expect((await t.request('POST', `/api/reviews/${c.id}`, { body: {} })).status).toBe(401)
    expect((await t.request('DELETE', `/api/reviews/${c.id}?profileId=x`)).status).toBe(401)
  })

  it('GET lists up to 20 newest reviews with profile name and avatar only', async () => {
    const { u, p, c, token } = await setup()
    await t.db
      .insert(review)
      .values([{ userId: u.id, profileId: p.id, contentId: c.id, rating: 7, comment: 'ok' }])
    const res = await t.request('GET', `/api/v1/reviews/${c.id}`, { token })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].profile).toEqual({ name: p.name, avatarUrl: p.avatarUrl })
  })

  it('POST validates the body (400) including rating bounds and profileId format', async () => {
    const { p, c, token } = await setup()
    const url = `/api/reviews/${c.id}`
    expect((await t.request('POST', url, { token })).status).toBe(400)
    expect(
      (await t.request('POST', url, { token, body: { profileId: p.id, rating: 11 } })).status
    ).toBe(400)
    expect(
      (await t.request('POST', url, { token, body: { profileId: p.id, rating: 0 } })).status
    ).toBe(400)
    expect(
      (await t.request('POST', url, { token, body: { profileId: p.id, rating: 5.5 } })).status
    ).toBe(400)
    expect(
      (await t.request('POST', url, { token, body: { profileId: 'not an id!', rating: 5 } })).status
    ).toBe(400)
  })

  it('POST returns 403 when profileId belongs to another user', async () => {
    const { c, token } = await setup()
    const other = await t.seedUser()
    const op = await t.seedProfile(other.id)
    const res = await t.request('POST', `/api/reviews/${c.id}`, {
      token,
      body: { profileId: op.id, rating: 5 },
    })
    expect(res.status).toBe(403)
  })

  it('POST upserts one review per profile+content (201), keeping the comment when omitted', async () => {
    const { p, c, token } = await setup()
    const url = `/api/reviews/${c.id}`
    const first = await t.request('POST', url, {
      token,
      body: { profileId: p.id, rating: 6, comment: 'good' },
    })
    expect(first.status).toBe(201)
    const second = await t.request('POST', url, { token, body: { profileId: p.id, rating: 9 } })
    expect(second.status).toBe(201)
    expect(second.body.data.id).toBe(first.body.data.id)
    expect(second.body.data).toMatchObject({ rating: 9, comment: 'good' })
    expect(await t.db.select().from(review).where(eq(review.contentId, c.id))).toHaveLength(1)
  })

  it('DELETE: 400 without profileId (legacy body shape), 403 for another users profile, 200 deletes', async () => {
    const { u, p, c, token } = await setup()
    const missing = await t.request('DELETE', `/api/reviews/${c.id}`, { token })
    expect(missing.status).toBe(400)
    expect(missing.body).toEqual({ message: 'profileId query parameter required' })

    const other = await t.seedUser()
    const op = await t.seedProfile(other.id)
    expect(
      (await t.request('DELETE', `/api/reviews/${c.id}?profileId=${op.id}`, { token })).status
    ).toBe(403)

    await t.db.insert(review).values({ userId: u.id, profileId: p.id, contentId: c.id, rating: 5 })
    const ok = await t.request('DELETE', `/api/reviews/${c.id}?profileId=${p.id}`, { token })
    expect(ok.status).toBe(200)
    expect(ok.body.message).toBe('Review deleted')
    expect(await t.db.select().from(review).where(eq(review.contentId, c.id))).toHaveLength(0)
  })
})
