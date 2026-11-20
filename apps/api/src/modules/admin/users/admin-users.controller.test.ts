import { eq, subscription, user, adminLog } from '@netflix/db'
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
  const a = await adminAuth(t, { email: 'root@admin.test', name: 'Root' })
  token = a.token
  adminId = a.admin.id
})
const call = (method: Parameters<TestApp['request']>[0], url: string, body?: unknown) =>
  t.request(method, `/api/admin/users${url}`, { token, body })

describe('GET /', () => {
  it('lists users newest first with profile counts and subscription summary', async () => {
    const u = await t.seedUser({ email: 'ann@x.test', name: 'Ann' })
    await t.seedProfile(u.id)
    await t.seedProfile(u.id)
    await t.db.insert(subscription).values({ userId: u.id, plan: 'PREMIUM', status: 'ACTIVE' })

    const res = await call('GET', '')
    expect(res.status).toBe(200)
    expect(res.body.totalResults).toBe(2)
    const ann = res.body.data.find((d: { email: string }) => d.email === 'ann@x.test')
    expect(ann).toMatchObject({
      profileCount: 2,
      subscription: { plan: 'PREMIUM', status: 'ACTIVE' },
      isSuspended: false,
    })
    expect(ann.hashedPassword).toBeUndefined()
    const root = res.body.data.find((d: { id: string }) => d.id === adminId)
    expect(root).toMatchObject({ profileCount: 0, subscription: null })
  })

  it('searches by email or name (case-insensitive) and paginates', async () => {
    await t.seedUser({ email: 'zed@x.test', name: 'Zed' })
    await t.seedUser({ email: 'bob@x.test', name: 'Robert' })
    expect((await call('GET', '?q=ZED')).body.data).toHaveLength(1)
    expect((await call('GET', '?q=robert')).body.data[0].email).toBe('bob@x.test')
    const page = await call('GET', '?limit=1&page=2')
    expect(page.body.data).toHaveLength(1)
    expect(page.body.totalPages).toBe(3)
  })
})

describe('GET /:id', () => {
  it('returns the user with profiles/subscription and never leaks secrets', async () => {
    const u = await t.seedUser()
    await t.seedProfile(u.id)
    const res = await call('GET', `/${u.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.profiles).toHaveLength(1)
    expect(res.body.data._count).toEqual({ profiles: 1 })
    expect(res.body.data.hashedPassword).toBeUndefined()
    expect(res.body.data.mfaSecret).toBeUndefined()
  })

  it('404s for an unknown user', async () => {
    expect((await call('GET', '/nope')).status).toBe(404)
  })
})

describe('PUT /:id', () => {
  it('suspends a user and changes role/name', async () => {
    const u = await t.seedUser()
    const res = await call('PUT', `/${u.id}`, { isSuspended: true, role: 'ADMIN', name: 'New' })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ isSuspended: true, role: 'ADMIN', name: 'New' })
    expect(res.body.data.hashedPassword).toBeUndefined()
    expect((await t.db.query.user.findFirst({ where: eq(user.id, u.id) }))?.isSuspended).toBe(true)
  })

  it('validates the body and 404s for unknown users', async () => {
    const u = await t.seedUser()
    expect((await call('PUT', `/${u.id}`, { role: 'ROOT' })).status).toBe(400)
    expect((await call('PUT', '/nope', { name: 'x' })).status).toBe(404)
  })

  it('a suspended admin loses access immediately', async () => {
    const other = await adminAuth(t)
    await call('PUT', `/${other.admin.id}`, { isSuspended: true })
    expect((await t.request('GET', '/api/admin/users', { token: other.token })).status).toBe(403)
  })
})

describe('DELETE /:id', () => {
  it('deletes a user and cascades profiles', async () => {
    const u = await t.seedUser()
    await t.seedProfile(u.id)
    const res = await call('DELETE', `/${u.id}`)
    expect(res.body.message).toBe('User deleted')
    expect(await t.db.query.user.findFirst({ where: eq(user.id, u.id) })).toBeUndefined()
  })

  it('404s for unknown users and 409s when audit-log rows block deletion', async () => {
    expect((await call('DELETE', '/nope')).status).toBe(404)
    await t.db.insert(adminLog).values({ adminId, action: 'X', resource: 'Y' })
    const res = await call('DELETE', `/${adminId}`)
    expect(res.status).toBe(409)
  })
})

describe('POST /:id/subscription', () => {
  it('creates then updates the subscription (upsert) with status 200', async () => {
    const u = await t.seedUser()
    const created = await call('POST', `/${u.id}/subscription`, { plan: 'BASIC', status: 'ACTIVE' })
    expect(created.status).toBe(200)
    expect(created.body.data).toMatchObject({ plan: 'BASIC', status: 'ACTIVE' })
    const updated = await call('POST', `/${u.id}/subscription`, {
      plan: 'PREMIUM',
      status: 'PAST_DUE',
    })
    expect(updated.body.data).toMatchObject({
      plan: 'PREMIUM',
      status: 'PAST_DUE',
      id: created.body.data.id,
    })
  })

  it('validates plan/status and 404s for unknown users', async () => {
    const u = await t.seedUser()
    expect(
      (await call('POST', `/${u.id}/subscription`, { plan: 'GOLD', status: 'ACTIVE' })).status
    ).toBe(400)
    expect(
      (await call('POST', '/nope/subscription', { plan: 'BASIC', status: 'ACTIVE' })).status
    ).toBe(404)
  })
})
