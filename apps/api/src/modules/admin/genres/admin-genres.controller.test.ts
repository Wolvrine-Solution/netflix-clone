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
  t.request(method, `/api/admin/genres${url}`, { token, body })

describe('admin genres', () => {
  it('lists genres alphabetically with content counts', async () => {
    await t.seedContent({ genres: ['Zombie', 'Action'] })
    await t.seedContent({ genres: ['Action'] })
    const res = await call('GET', '')
    expect(res.status).toBe(200)
    expect(res.body.data.map((g: { name: string }) => g.name)).toEqual(['Action', 'Zombie'])
    expect(res.body.data[0]._count).toEqual({ contents: 2 })
    expect(res.body.data[1]._count).toEqual({ contents: 1 })
  })

  it('POST upserts by id with status 201 and validates input', async () => {
    const created = await call('POST', '', { id: 5, name: 'Noir' })
    expect(created.status).toBe(201)
    expect(created.body.data).toEqual({ id: 5, name: 'Noir' })
    const renamed = await call('POST', '', { id: 5, name: 'Film Noir' })
    expect(renamed.status).toBe(201)
    expect(renamed.body.data.name).toBe('Film Noir')
    expect((await call('GET', '')).body.data).toHaveLength(1)
    expect((await call('POST', '', { id: -1, name: 'x' })).status).toBe(400)
    expect((await call('POST', '', { id: 1, name: '' })).status).toBe(400)
  })

  it('PUT renames and DELETE removes; both 404 for unknown ids', async () => {
    await call('POST', '', { id: 9, name: 'Old' })
    expect((await call('PUT', '/9', { name: 'New' })).body.data.name).toBe('New')
    expect((await call('PUT', '/404', { name: 'x' })).status).toBe(404)
    expect((await call('PUT', '/abc', { name: 'x' })).status).toBe(400)
    expect((await call('DELETE', '/9')).body.message).toBe('Genre deleted')
    expect((await call('DELETE', '/9')).status).toBe(404)
  })
})
