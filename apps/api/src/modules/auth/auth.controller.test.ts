import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

describe('POST /api/auth/signin', () => {
  it('returns 400 when email is missing', async () => {
    const res = await t.request('POST', '/api/auth/signin', { body: { password: 'secret' } })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/required/i)
  })

  it('returns 400 when password is missing', async () => {
    const res = await t.request('POST', '/api/auth/signin', { body: { email: 'a@b.com' } })
    expect(res.status).toBe(400)
  })

  it('returns 401 for an unknown user', async () => {
    const res = await t.request('POST', '/api/auth/signin', {
      body: { email: 'nope@b.com', password: 'secret' },
    })
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/invalid email or password/i)
  })

  it('returns 401 for an OAuth-only account without a password', async () => {
    const u = await t.seedUser({ email: 'oauth@b.com' })
    await t.db
      .update((await import('@netflix/db')).user)
      .set({ hashedPassword: null })
      .where((await import('@netflix/db')).eq((await import('@netflix/db')).user.id, u.id))
    const res = await t.request('POST', '/api/auth/signin', {
      body: { email: 'oauth@b.com', password: 'secret' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 for a wrong password', async () => {
    await t.seedUser({ email: 'a@b.com', password: 'correct-password' })
    const res = await t.request('POST', '/api/auth/signin', {
      body: { email: 'a@b.com', password: 'wrong-password' },
    })
    expect(res.status).toBe(401)
  })

  it('returns tokens and a sanitized user on valid credentials (also under /api/v1)', async () => {
    await t.seedUser({ email: 'a@b.com', password: 'correct-password', name: 'Ann' })
    for (const base of ['/api/auth', '/api/v1/auth']) {
      const res = await t.request('POST', `${base}/signin`, {
        body: { email: ' A@B.com ', password: 'correct-password' },
      })
      expect(res.status).toBe(200)
      expect(res.body.token).toEqual(expect.any(String))
      expect(res.body.refreshToken).toEqual(expect.any(String))
      expect(res.body.user).toMatchObject({ email: 'a@b.com', name: 'Ann' })
      expect(res.body.user.hashedPassword).toBeUndefined()
    }
  })
})

describe('refresh and revoke', () => {
  it('rotates a refresh token once, then rejects the old one', async () => {
    await t.seedUser({ email: 'a@b.com', password: 'pw-123456' })
    const signin = await t.request('POST', '/api/auth/signin', {
      body: { email: 'a@b.com', password: 'pw-123456' },
    })
    const first = signin.body.refreshToken
    const rotated = await t.request('POST', '/api/auth/refresh', { body: { refreshToken: first } })
    expect(rotated.status).toBe(200)
    expect(rotated.body.data.refreshToken).not.toBe(first)
    const replay = await t.request('POST', '/api/auth/refresh', { body: { refreshToken: first } })
    expect(replay.status).toBe(401)
  })

  it('requires refreshToken', async () => {
    const res = await t.request('POST', '/api/auth/refresh', { body: {} })
    expect(res.status).toBe(400)
  })

  it('revoke requires authentication and revokes only the caller', async () => {
    expect((await t.request('POST', '/api/auth/revoke', { body: { userId: 'x' } })).status).toBe(
      401
    )

    await t.seedUser({ email: 'a@b.com', password: 'pw-123456' })
    const signin = await t.request('POST', '/api/auth/signin', {
      body: { email: 'a@b.com', password: 'pw-123456' },
    })
    const revoked = await t.request('POST', '/api/auth/revoke', { token: signin.body.token })
    expect(revoked.status).toBe(200)
    const after = await t.request('POST', '/api/auth/refresh', {
      body: { refreshToken: signin.body.refreshToken },
    })
    expect(after.status).toBe(401)
  })
})
