import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { contentRow, row } from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

async function seedRow(title: string, order: number, contents: { id: string }[]) {
  const [r] = await t.db.insert(row).values({ title, query: title, order }).returning()
  for (const [i, c] of contents.entries())
    await t.db.insert(contentRow).values({ rowId: r!.id, contentId: c.id, order: i })
  return r!
}

describe('GET /api/rows', () => {
  it('returns empty data when there are no rows', async () => {
    const res = await t.request('GET', '/api/rows')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ data: [] })
  })

  it('returns rows by order with items by order, mapped with genres', async () => {
    const a = await t.seedContent({ title: 'A', genres: ['Drama'] })
    const b = await t.seedContent({ title: 'B' })
    await seedRow('Second', 2, [a])
    await seedRow('First', 1, [b, a])

    for (const base of ['/api/rows', '/api/v1/rows']) {
      const res = await t.request('GET', base)
      expect(res.status).toBe(200)
      expect(res.body.data.map((r: { title: string }) => r.title)).toEqual(['First', 'Second'])
      expect(res.body.data[0].items.map((i: { title: string }) => i.title)).toEqual(['B', 'A'])
      expect(res.body.data[1].items[0].genres).toEqual([{ id: expect.any(Number), name: 'Drama' }])
      expect(res.body.data[0].items[0].tmdbId).toBeUndefined()
      expect(res.headers['cache-control']).toContain('public')
    }
  })

  it('limits each row to 20 items', async () => {
    const items = []
    for (let i = 0; i < 22; i++) items.push(await t.seedContent({ title: `C${i}` }))
    await seedRow('Big', 1, items)
    const res = await t.request('GET', '/api/rows')
    expect(res.body.data[0].items).toHaveLength(20)
  })

  it('filters items to kid-safe ratings for kid profiles', async () => {
    const u = await t.seedUser()
    const kid = await t.seedProfile(u.id, { isKid: true })
    const k = await t.seedContent({ title: 'Kids', maturityRating: 'TV-Y' })
    const x = await t.seedContent({ title: 'Adult', maturityRating: 'R' })
    await seedRow('Mixed', 1, [k, x])
    const res = await t.request('GET', `/api/rows?profileId=${kid.id}`, {
      token: await t.token(u.id),
    })
    expect(res.body.data[0].items.map((i: { title: string }) => i.title)).toEqual(['Kids'])

    const viaFlag = await t.request('GET', '/api/rows?isKid=true')
    expect(viaFlag.body.data[0].items).toHaveLength(1)
  })
})
