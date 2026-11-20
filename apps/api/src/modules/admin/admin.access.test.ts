import { eq, user } from '@netflix/db'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'
import { adminAuth } from './admin.test-utils'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

const PROTECTED = [
  '/api/admin/content',
  '/api/admin/rows',
  '/api/admin/users',
  '/api/admin/genres',
  '/api/admin/analytics/dashboard',
  '/api/admin/analytics/top-content',
  '/api/admin/analytics/user-growth',
  '/api/admin/analytics/recent-logs',
]

describe('admin access control', () => {
  it.each(PROTECTED)('%s rejects unauthenticated requests with 401', async (url) => {
    expect((await t.request('GET', url)).status).toBe(401)
  })

  it.each(PROTECTED)('%s rejects non-admin users with 403', async (url) => {
    const u = await t.seedUser()
    expect((await t.request('GET', url, { token: await t.token(u.id) })).status).toBe(403)
  })

  it('rejects suspended admins with 403', async () => {
    const { admin, token } = await adminAuth(t)
    await t.db.update(user).set({ isSuspended: true }).where(eq(user.id, admin.id))
    const res = await t.request('GET', '/api/admin/content', { token })
    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/suspended/i)
  })

  it('requires an MFA session when the admin enabled MFA', async () => {
    const { admin, token } = await adminAuth(t)
    await t.db.update(user).set({ mfaEnabled: true, mfaSecret: 'S' }).where(eq(user.id, admin.id))
    const res = await t.request('GET', '/api/admin/content', { token })
    expect(res.status).toBe(403)
    expect(res.body.message).toBe('MFA verification required')
  })

  it('is not mounted under /api/v1', async () => {
    const { token } = await adminAuth(t)
    expect((await t.request('GET', '/api/v1/admin/content', { token })).status).toBe(404)
  })
})
