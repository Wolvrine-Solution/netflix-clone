import { eq, user } from '@netflix/db'
import { authenticator } from 'otplib'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../../test/harness'
import { adminAuth } from '../admin.test-utils'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

const row = (id: string) => t.db.query.user.findFirst({ where: eq(user.id, id) })

describe('admin MFA', () => {
  it('rejects unauthenticated and non-admin callers', async () => {
    expect((await t.request('POST', '/api/admin/mfa/setup')).status).toBe(401)
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/admin/mfa/setup', { token: await t.token(u.id) })
    expect(res.status).toBe(403)
  })

  it('POST /setup generates a TOTP secret and stores it', async () => {
    const { admin, token } = await adminAuth(t, { email: 'admin@test.com' })
    const res = await t.request('POST', '/api/admin/mfa/setup', { token })
    expect(res.status).toBe(200)
    expect(res.body.data.secret).toBeTruthy()
    expect(res.body.data.otpauthUrl).toMatch(/otpauth:\/\/totp\//)
    expect((await row(admin.id))?.mfaSecret).toBe(res.body.data.secret)
  })

  it('POST /setup refuses when MFA is already enabled', async () => {
    const { admin, token } = await adminAuth(t)
    await t.db.update(user).set({ mfaEnabled: true, mfaSecret: 'S' }).where(eq(user.id, admin.id))
    // AdminBaseGuard does not require an MFA session
    const res = await t.request('POST', '/api/admin/mfa/setup', { token })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('MFA is already enabled')
  })

  it('POST /enable verifies the TOTP code, enables MFA and opens an MFA session', async () => {
    const { admin, token } = await adminAuth(t)
    const setup = await t.request('POST', '/api/admin/mfa/setup', { token })
    const code = authenticator.generate(setup.body.data.secret)

    const res = await t.request('POST', '/api/admin/mfa/enable', { token, body: { code } })
    expect(res.status).toBe(200)
    expect(res.body.data.enabled).toBe(true)
    expect((await row(admin.id))?.mfaEnabled).toBe(true)
    // session established: guarded admin routes are reachable without a separate verify
    expect((await t.request('GET', '/api/admin/genres', { token })).status).toBe(200)
  })

  it('POST /enable rejects before setup, bad codes and malformed codes', async () => {
    const { token } = await adminAuth(t)
    expect(
      (await t.request('POST', '/api/admin/mfa/enable', { token, body: { code: '123456' } })).body
        .message
    ).toBe('Run MFA setup first')

    await t.request('POST', '/api/admin/mfa/setup', { token })
    const wrong = await t.request('POST', '/api/admin/mfa/enable', {
      token,
      body: { code: '000000' },
    })
    expect([401]).toContain(wrong.status)
    expect(wrong.body.message).toBe('Invalid TOTP code')

    const bad = await t.request('POST', '/api/admin/mfa/enable', { token, body: { code: 'abc' } })
    expect(bad.status).toBe(400)
  })

  it('POST /verify establishes an MFA session for an MFA-enabled admin', async () => {
    const { admin, token } = await adminAuth(t)
    const secret = authenticator.generateSecret()
    await t.db
      .update(user)
      .set({ mfaEnabled: true, mfaSecret: secret })
      .where(eq(user.id, admin.id))

    expect((await t.request('GET', '/api/admin/genres', { token })).status).toBe(403)
    const res = await t.request('POST', '/api/admin/mfa/verify', {
      token,
      body: { code: authenticator.generate(secret) },
    })
    expect(res.status).toBe(200)
    expect(res.body.data.verified).toBe(true)
    expect((await t.request('GET', '/api/admin/genres', { token })).status).toBe(200)
  })

  it('POST /verify and /disable reject when MFA is not enabled', async () => {
    const { token } = await adminAuth(t)
    for (const p of ['verify', 'disable']) {
      const res = await t.request('POST', `/api/admin/mfa/${p}`, {
        token,
        body: { code: '123456' },
      })
      expect(res.status).toBe(400)
      expect(res.body.message).toBe('MFA is not enabled for this account')
    }
  })

  it('POST /disable clears MFA and the session', async () => {
    const { admin, token } = await adminAuth(t)
    const secret = authenticator.generateSecret()
    await t.db
      .update(user)
      .set({ mfaEnabled: true, mfaSecret: secret })
      .where(eq(user.id, admin.id))

    const res = await t.request('POST', '/api/admin/mfa/disable', {
      token,
      body: { code: authenticator.generate(secret) },
    })
    expect(res.status).toBe(200)
    expect(res.body.data.disabled).toBe(true)
    const after = await row(admin.id)
    expect(after).toMatchObject({ mfaEnabled: false, mfaSecret: null })
  })
})
