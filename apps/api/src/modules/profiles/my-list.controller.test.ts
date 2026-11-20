import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

import { eq, myListItem } from '@netflix/db'

async function setup() {
  const u = await t.seedUser()
  const p = await t.seedProfile(u.id)
  return { u, p, token: await t.token(u.id) }
}

describe('my-list routes', () => {
  it('all routes require authentication', async () => {
    const { p } = await setup()
    expect((await t.request('GET', `/api/profiles/${p.id}/my-list`)).status).toBe(401)
    expect(
      (await t.request('POST', `/api/profiles/${p.id}/my-list`, { body: { contentId: 'x' } }))
        .status
    ).toBe(401)
    expect((await t.request('DELETE', `/api/profiles/${p.id}/my-list/x`)).status).toBe(401)
  })

  it('returns 403 for a profile that is not the callers (GET, POST, DELETE) and changes nothing', async () => {
    const { token } = await setup()
    const other = await t.seedUser()
    const op = await t.seedProfile(other.id)
    const c = await t.seedContent()
    await t.db.insert(myListItem).values({ profileId: op.id, contentId: c.id })
    expect((await t.request('GET', `/api/profiles/${op.id}/my-list`, { token })).status).toBe(403)
    expect(
      (
        await t.request('POST', `/api/profiles/${op.id}/my-list`, {
          token,
          body: { contentId: c.id },
        })
      ).status
    ).toBe(403)
    expect(
      (await t.request('DELETE', `/api/profiles/${op.id}/my-list/${c.id}`, { token })).status
    ).toBe(403)
    expect(
      await t.db.select().from(myListItem).where(eq(myListItem.profileId, op.id))
    ).toHaveLength(1)
  })

  it('POST creates an item (201) and GET returns content with genres, newest first', async () => {
    const { p, token } = await setup()
    const first = await t.seedContent({ title: 'First', genres: ['Drama'] })
    const second = await t.seedContent({ title: 'Second' })
    const created = await t.request('POST', `/api/v1/profiles/${p.id}/my-list`, {
      token,
      body: { contentId: first.id },
    })
    expect(created.status).toBe(201)
    expect(created.body.data).toMatchObject({ profileId: p.id, contentId: first.id })
    await new Promise((r) => setTimeout(r, 5))
    await t.request('POST', `/api/profiles/${p.id}/my-list`, {
      token,
      body: { contentId: second.id },
    })

    const res = await t.request('GET', `/api/profiles/${p.id}/my-list`, { token })
    expect(res.status).toBe(200)
    expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['Second', 'First'])
    expect(res.body.data[1].genres[0].genre.name).toBe('Drama')
  })

  it('DELETE removes only the matching profile+content item', async () => {
    const { p, token } = await setup()
    const a = await t.seedContent()
    const b = await t.seedContent()
    await t.db.insert(myListItem).values([
      { profileId: p.id, contentId: a.id },
      { profileId: p.id, contentId: b.id },
    ])
    const res = await t.request('DELETE', `/api/profiles/${p.id}/my-list/${a.id}`, { token })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Removed from list')
    const left = await t.db.select().from(myListItem).where(eq(myListItem.profileId, p.id))
    expect(left.map((i) => i.contentId)).toEqual([b.id])
  })
})

describe('POST my-list is idempotent and validates (fixes former 500s)', () => {
  it('adding the same item twice returns the same row; unknown content is 404; missing id is 400', async () => {
    const u = await t.seedUser()
    const p = await t.seedProfile(u.id)
    const c = await t.seedContent()
    const token = await t.token(u.id)
    const url = `/api/profiles/${p.id}/my-list`
    const first = await t.request('POST', url, { token, body: { contentId: c.id } })
    const second = await t.request('POST', url, { token, body: { contentId: c.id } })
    expect([first.status, second.status]).toEqual([201, 201])
    expect(second.body.data.contentId).toBe(c.id)
    expect((await t.request('POST', url, { token, body: { contentId: 'nope' } })).status).toBe(404)
    expect((await t.request('POST', url, { token, body: {} })).status).toBe(400)
  })
})
