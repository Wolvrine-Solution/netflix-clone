import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

import { eq, profile } from '@netflix/db'

async function login(opts?: { email?: string }) {
  const u = await t.seedUser(opts)
  return { u, token: await t.token(u.id) }
}

describe('profiles routes', () => {
  it('GET / requires authentication', async () => {
    expect((await t.request('GET', '/api/profiles')).status).toBe(401)
  })

  it('GET / scopes results to the authenticated user (both mounts)', async () => {
    const a = await login()
    const b = await login()
    await t.seedProfile(a.u.id, { name: 'Mine' })
    await t.seedProfile(b.u.id, { name: 'Theirs' })
    for (const base of ['/api/profiles', '/api/v1/profiles']) {
      const res = await t.request('GET', base, { token: a.token })
      expect(res.status).toBe(200)
      expect(res.body.data.map((p: { name: string }) => p.name)).toEqual(['Mine'])
    }
  })

  it('POST / rejects creating a 6th profile (max 5)', async () => {
    const a = await login()
    for (let i = 0; i < 5; i++) await t.seedProfile(a.u.id, { name: `P${i}` })
    const res = await t.request('POST', '/api/profiles', {
      token: a.token,
      body: { name: 'Sixth', avatarUrl: 'a.png' },
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/maximum 5/i)
  })

  it('POST / creates a profile under the limit, defaulting isKid to false', async () => {
    const a = await login()
    const res = await t.request('POST', '/api/profiles', {
      token: a.token,
      body: { name: 'New', avatarUrl: 'a.png' },
    })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ name: 'New', isKid: false, userId: a.u.id })
    const kid = await t.request('POST', '/api/profiles', {
      token: a.token,
      body: { name: 'Kid', avatarUrl: 'k.png', isKid: true },
    })
    expect(kid.body.data.isKid).toBe(true)
  })

  it('PUT /:id returns 404 when the profile is not owned by the user', async () => {
    const a = await login()
    const b = await login()
    const p = await t.seedProfile(b.u.id)
    const res = await t.request('PUT', `/api/profiles/${p.id}`, {
      token: a.token,
      body: { name: 'Hack' },
    })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Profile not found')
  })

  it('PUT /:id only updates the fields provided', async () => {
    const a = await login()
    const p = await t.seedProfile(a.u.id, { name: 'Old' })
    const res = await t.request('PUT', `/api/profiles/${p.id}`, {
      token: a.token,
      body: { name: 'Renamed' },
    })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ name: 'Renamed', avatarUrl: 'a.png', isKid: false })
  })

  it('PUT /:id can set isKid to false explicitly (falsy but defined)', async () => {
    const a = await login()
    const p = await t.seedProfile(a.u.id, { isKid: true })
    const res = await t.request('PUT', `/api/profiles/${p.id}`, {
      token: a.token,
      body: { isKid: false },
    })
    expect(res.body.data.isKid).toBe(false)
  })

  it('PUT /:id with an empty body is a no-op that returns the profile', async () => {
    const a = await login()
    const p = await t.seedProfile(a.u.id, { name: 'Same' })
    const res = await t.request('PUT', `/api/profiles/${p.id}`, { token: a.token })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Same')
  })

  it('DELETE /:id returns 404 for an unowned profile and deletes an owned one', async () => {
    const a = await login()
    const b = await login()
    const theirs = await t.seedProfile(b.u.id)
    const mine = await t.seedProfile(a.u.id)
    expect(
      (await t.request('DELETE', `/api/profiles/${theirs.id}`, { token: a.token })).status
    ).toBe(404)
    const res = await t.request('DELETE', `/api/profiles/${mine.id}`, { token: a.token })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Profile deleted')
    expect(await t.db.select().from(profile).where(eq(profile.id, mine.id))).toHaveLength(0)
    expect(await t.db.select().from(profile).where(eq(profile.id, theirs.id))).toHaveLength(1)
  })
})

describe('profile PIN routes', () => {
  it('PUT /:id/pin rejects invalid PIN format with 400 and requires auth', async () => {
    const a = await login()
    const p = await t.seedProfile(a.u.id)
    expect(
      (await t.request('PUT', `/api/profiles/${p.id}/pin`, { body: { pin: '1234' } })).status
    ).toBe(401)
    const bad = await t.request('PUT', `/api/profiles/${p.id}/pin`, {
      token: a.token,
      body: { pin: 'abc' },
    })
    expect(bad.status).toBe(400)
    expect(bad.body.message).toMatch(/PIN must be 4–6 digits/)
    const missing = await t.request('PUT', `/api/profiles/${p.id}/pin`, { token: a.token })
    expect(missing.status).toBe(400)
  })

  it('PUT /:id/pin returns 403 for a profile not owned by the user', async () => {
    const a = await login()
    const b = await login()
    const p = await t.seedProfile(b.u.id)
    const res = await t.request('PUT', `/api/profiles/${p.id}/pin`, {
      token: a.token,
      body: { pin: '1234' },
    })
    expect(res.status).toBe(403)
  })

  it('PUT sets a hashed PIN, DELETE clears it', async () => {
    const a = await login()
    const p = await t.seedProfile(a.u.id)
    const set = await t.request('PUT', `/api/profiles/${p.id}/pin`, {
      token: a.token,
      body: { pin: '1234' },
    })
    expect(set.body.data).toEqual({ id: p.id, hasPin: true })
    const [row] = await t.db.select().from(profile).where(eq(profile.id, p.id))
    expect(row!.pinHash).toBeTruthy()
    expect(row!.pinHash).not.toBe('1234')
    const cleared = await t.request('DELETE', `/api/profiles/${p.id}/pin`, { token: a.token })
    expect(cleared.body.data).toEqual({ id: p.id, hasPin: false })
    const [after] = await t.db.select().from(profile).where(eq(profile.id, p.id))
    expect(after!.pinHash).toBeNull()
  })

  it('POST /:id/pin/verify: 400 when no PIN set, 401 on wrong PIN, 200 on correct', async () => {
    const a = await login()
    const p = await t.seedProfile(a.u.id)
    const url = `/api/profiles/${p.id}/pin/verify`
    expect((await t.request('POST', url, { token: a.token, body: { pin: '1234' } })).status).toBe(
      400
    )
    await t.request('PUT', `/api/profiles/${p.id}/pin`, { token: a.token, body: { pin: '1234' } })
    const wrong = await t.request('POST', url, { token: a.token, body: { pin: '9999' } })
    expect(wrong.status).toBe(401)
    expect(wrong.body.message).toBe('Invalid PIN')
    const ok = await t.request('POST', url, { token: a.token, body: { pin: '1234' } })
    expect(ok.status).toBe(200)
    expect(ok.body.data).toEqual({ verified: true })
  })

  it('POST /:id/access: open without PIN; with PIN requires the right one', async () => {
    const a = await login()
    const p = await t.seedProfile(a.u.id)
    const url = `/api/profiles/${p.id}/access`
    const open = await t.request('POST', url, { token: a.token })
    expect(open.status).toBe(200)
    expect(open.body.data).toEqual({ accessGranted: true })

    await t.request('PUT', `/api/profiles/${p.id}/pin`, { token: a.token, body: { pin: '123456' } })
    const none = await t.request('POST', url, { token: a.token, body: {} })
    expect(none.status).toBe(401)
    expect(none.body.message).toBe('PIN required')
    expect((await t.request('POST', url, { token: a.token, body: { pin: '111111' } })).status).toBe(
      401
    )
    expect(
      (await t.request('POST', url, { token: a.token, body: { pin: '123456' } })).body.data
        .accessGranted
    ).toBe(true)
  })

  it('POST /:id/access returns 403 for an unowned profile', async () => {
    const a = await login()
    const b = await login()
    const p = await t.seedProfile(b.u.id)
    expect(
      (await t.request('POST', `/api/profiles/${p.id}/access`, { token: a.token })).status
    ).toBe(403)
  })
})

describe('POST /api/profiles validation (fixes former 500s)', () => {
  it('rejects a missing name or avatar with 400', async () => {
    const { token } = await login()
    for (const body of [{}, { name: 'X' }, { avatarUrl: 'a' }, { name: '  ', avatarUrl: 'a' }]) {
      const res = await t.request('POST', '/api/profiles', { token, body })
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/^Validation error/)
    }
    expect((await t.request('POST', '/api/profiles', { token })).status).toBe(400)
  })

  it('returns 409 for a duplicate profile name', async () => {
    const { token } = await login()
    const ok = await t.request('POST', '/api/profiles', {
      token,
      body: { name: 'Dup', avatarUrl: 'a' },
    })
    expect(ok.status).toBe(201)
    const dup = await t.request('POST', '/api/profiles', {
      token,
      body: { name: 'Dup', avatarUrl: 'a' },
    })
    expect(dup.status).toBe(409)
  })
})
