import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../../test/harness'
import { adminAuth } from '../admin.test-utils'

let t: TestApp
let token: string
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(async () => {
  await t.reset()
  token = (await adminAuth(t)).token
})
const call = (method: Parameters<TestApp['request']>[0], url: string, body?: unknown) =>
  t.request(method, `/api/admin/rows${url}`, { token, body })
const mk = (title: string, extra: object = {}) =>
  call('POST', '', { title, query: title.toLowerCase(), ...extra })

describe('rows CRUD and ordering', () => {
  it('creates rows with auto-incrementing order and isActive default', async () => {
    const a = await mk('Alpha')
    const b = await mk('Beta')
    const c = await mk('Gamma', { order: 10 })
    expect(a.status).toBe(201)
    expect([a.body.data.order, b.body.data.order, c.body.data.order]).toEqual([0, 1, 10])
    expect(a.body.data.isActive).toBe(true)
    expect((await mk('Delta')).body.data.order).toBe(11)
  })

  it('validates input', async () => {
    expect((await call('POST', '', { title: '' })).status).toBe(400)
    expect((await call('POST', '', { title: 'x', query: 'x', order: -1 })).status).toBe(400)
  })

  it('lists rows by order with content counts', async () => {
    const a = await mk('Alpha', { order: 2 })
    await mk('Beta', { order: 1 })
    const c = await t.seedContent()
    await call('POST', `/${a.body.data.id}/content`, { contentId: c.id })
    const res = await call('GET', '')
    expect(res.body.data.map((r: { title: string }) => r.title)).toEqual(['Beta', 'Alpha'])
    expect(res.body.data[1]).toMatchObject({ contentCount: 1, _count: { contents: 1 } })
  })

  it('PUT /:id updates only supplied fields (isActive default must not reset)', async () => {
    const r = await mk('Alpha', { isActive: false })
    const res = await call('PUT', `/${r.body.data.id}`, { title: 'Renamed' })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ title: 'Renamed', isActive: false, query: 'alpha' })
    expect((await call('PUT', '/nope', { title: 'x' })).status).toBe(404)
  })

  it('PUT /reorder applies new orders in bulk (before /:id matching)', async () => {
    const a = (await mk('Alpha')).body.data
    const b = (await mk('Beta')).body.data
    const res = await call('PUT', '/reorder', {
      rows: [
        { id: a.id, order: 5 },
        { id: b.id, order: 1 },
      ],
    })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Rows reordered')
    expect((await call('GET', '')).body.data.map((r: { title: string }) => r.title)).toEqual([
      'Beta',
      'Alpha',
    ])
    expect((await call('PUT', '/reorder', { rows: [{ id: 'nope', order: 1 }] })).status).toBe(404)
    expect((await call('PUT', '/reorder', {})).status).toBe(400)
  })

  it('DELETE removes the row; 404 when missing', async () => {
    const r = await mk('Alpha')
    expect((await call('DELETE', `/${r.body.data.id}`)).body.message).toBe('Row deleted')
    expect((await call('DELETE', `/${r.body.data.id}`)).status).toBe(404)
  })
})

describe('row contents', () => {
  it('adds content with increasing order (idempotent), lists with genres, removes', async () => {
    const r = (await mk('Alpha')).body.data
    const c1 = await t.seedContent({ title: 'One', genres: ['Drama'] })
    const c2 = await t.seedContent({ title: 'Two' })

    expect((await call('POST', `/${r.id}/content`, { contentId: c1.id })).body.message).toBe(
      'Content added to row'
    )
    await call('POST', `/${r.id}/content`, { contentId: c2.id })
    await call('POST', `/${r.id}/content`, { contentId: c1.id }) // duplicate is a no-op

    const res = await call('GET', `/${r.id}/content`)
    expect(res.status).toBe(200)
    expect(
      res.body.data.contents.map((x: { order: number; content: { title: string } }) => [
        x.order,
        x.content.title,
      ])
    ).toEqual([
      [0, 'One'],
      [1, 'Two'],
    ])
    expect(res.body.data.contents[0].content.genres[0].genre.name).toBe('Drama')

    expect((await call('DELETE', `/${r.id}/content/${c1.id}`)).body.message).toBe(
      'Content removed from row'
    )
    expect((await call('DELETE', `/${r.id}/content/${c1.id}`)).status).toBe(404)
  })

  it('404s for unknown rows and unknown content', async () => {
    expect((await call('GET', '/nope/content')).status).toBe(404)
    expect((await call('POST', '/nope/content', { contentId: 'x' })).status).toBe(404)
    const r = (await mk('Alpha')).body.data
    expect((await call('POST', `/${r.id}/content`, { contentId: 'missing' })).status).toBe(404)
    expect((await call('POST', `/${r.id}/content`, {})).status).toBe(400)
  })
})
