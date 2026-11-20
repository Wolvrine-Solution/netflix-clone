import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  consentRecord,
  content,
  dataSubjectRequest,
  eq,
  licenseWindow,
  myListItem,
  profile,
  watchHistory,
} from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'
import { ComplianceService } from './compliance.service'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

describe('consent', () => {
  it('requires auth and validates', async () => {
    expect((await t.request('POST', '/api/v1/compliance/consent', { body: {} })).status).toBe(401)
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/v1/compliance/consent', {
      token: await t.token(u.id),
      body: { consentType: 1 },
    })
    expect(res.status).toBe(400)
  })

  it('records consent with the caller ip', async () => {
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/v1/compliance/consent', {
      token: await t.token(u.id),
      body: { consentType: 'marketing', granted: true },
    })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ userId: u.id, consentType: 'marketing', granted: true })
    expect(res.body.data.ipAddress).toBeTruthy()
  })
})

describe('DSAR', () => {
  it('creates a pending request with 202', async () => {
    const u = await t.seedUser()
    const res = await t.request('POST', '/api/v1/compliance/dsar', {
      token: await t.token(u.id),
      body: { type: 'EXPORT' },
    })
    expect(res.status).toBe(202)
    expect(res.body.data).toMatchObject({ type: 'EXPORT', status: 'PENDING' })
    expect(
      (
        await t.request('POST', '/api/v1/compliance/dsar', {
          token: await t.token(u.id),
          body: { type: 'X' },
        })
      ).status
    ).toBe(400)
  })

  it('only admins can process; unknown request is 404', async () => {
    const u = await t.seedUser()
    const admin = await t.seedUser({ role: 'ADMIN' })
    expect(
      (await t.request('POST', '/api/v1/compliance/dsar/x/process', { token: await t.token(u.id) }))
        .status
    ).toBe(403)
    const res = await t.request('POST', '/api/v1/compliance/dsar/missing/process', {
      token: await t.token(admin.id),
    })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Request not found')
  })

  it('exports the user data and completes the request', async () => {
    const u = await t.seedUser({ email: 'x@y.com' })
    const admin = await t.seedUser({ role: 'ADMIN' })
    const p = await t.seedProfile(u.id)
    const c = await t.seedContent({ title: 'Seen' })
    await t.db.insert(watchHistory).values({ profileId: p.id, contentId: c.id, progress: 42 })
    const reqRow = await t.app.get(ComplianceService).createDsarRequest(u.id, 'EXPORT')

    const res = await t.request('POST', `/api/v1/compliance/dsar/${reqRow!.id}/process`, {
      token: await t.token(admin.id),
    })
    expect(res.status).toBe(200)
    expect(res.body.data.user).toMatchObject({ id: u.id, email: 'x@y.com' })
    expect(res.body.data.watchHistory).toEqual([{ contentId: c.id, progress: 42, title: 'Seen' }])
    const [row] = await t.db
      .select()
      .from(dataSubjectRequest)
      .where(eq(dataSubjectRequest.id, reqRow!.id))
    expect(row).toMatchObject({ status: 'COMPLETED' })
    expect(row!.completedAt).toBeInstanceOf(Date)
  })

  it('deletes profiles, history, list and consent but keeps the account', async () => {
    const u = await t.seedUser()
    const bystander = await t.seedUser()
    const admin = await t.seedUser({ role: 'ADMIN' })
    const p = await t.seedProfile(u.id)
    const bp = await t.seedProfile(bystander.id)
    const c = await t.seedContent()
    await t.db.insert(watchHistory).values([
      { profileId: p.id, contentId: c.id },
      { profileId: bp.id, contentId: c.id },
    ])
    await t.db.insert(myListItem).values({ profileId: p.id, contentId: c.id })
    await t.db.insert(consentRecord).values([
      { userId: u.id, consentType: 'a', granted: true },
      { userId: bystander.id, consentType: 'a', granted: true },
    ])
    const reqRow = await t.app.get(ComplianceService).createDsarRequest(u.id, 'DELETE')

    const res = await t.request('POST', `/api/v1/compliance/dsar/${reqRow!.id}/process`, {
      token: await t.token(admin.id),
    })
    expect(res.body).toEqual({ data: { deleted: true } })
    expect(await t.db.select().from(profile).where(eq(profile.userId, u.id))).toHaveLength(0)
    expect(await t.db.select().from(watchHistory)).toHaveLength(1)
    expect(await t.db.select().from(myListItem)).toHaveLength(0)
    expect(await t.db.select().from(consentRecord)).toHaveLength(1)
    const [row] = await t.db
      .select()
      .from(dataSubjectRequest)
      .where(eq(dataSubjectRequest.id, reqRow!.id))
    expect(row!.status).toBe('COMPLETED')
  })
})

describe('DMCA', () => {
  it('accepts anonymous reports with 201 and validates', async () => {
    const bad = await t.request('POST', '/api/v1/compliance/dmca', {
      body: { reporterEmail: 'nope', details: 'short' },
    })
    expect(bad.status).toBe(400)
    const res = await t.request('POST', '/api/v1/compliance/dmca', {
      body: { reporterEmail: 'rights@owner.com', details: 'This is my content, remove it' },
    })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ status: 'OPEN', reporterEmail: 'rights@owner.com' })
  })

  it('lists takedowns for admins only, newest first', async () => {
    const svc = t.app.get(ComplianceService)
    await svc.createDmcaTakedown('a@a.com', 'first takedown details')
    await new Promise((r) => setTimeout(r, 10))
    await svc.createDmcaTakedown('b@b.com', 'second takedown details')
    const u = await t.seedUser()
    const admin = await t.seedUser({ role: 'ADMIN' })
    expect((await t.request('GET', '/api/v1/compliance/dmca')).status).toBe(401)
    expect(
      (await t.request('GET', '/api/v1/compliance/dmca', { token: await t.token(u.id) })).status
    ).toBe(403)
    const res = await t.request('GET', '/api/v1/compliance/dmca', {
      token: await t.token(admin.id),
    })
    expect(res.body.data.map((d: { reporterEmail: string }) => d.reporterEmail)).toEqual([
      'b@b.com',
      'a@a.com',
    ])
  })
})

describe('unpublishExpiredLicenses', () => {
  it('archives published titles whose window ended, and nothing else', async () => {
    const past = new Date(Date.now() - 86_400_000)
    const future = new Date(Date.now() + 86_400_000)
    const expired = await t.seedContent({ title: 'Expired' })
    const draft = await t.seedContent({ title: 'Draft', status: 'DRAFT' })
    const live = await t.seedContent({ title: 'Live' })
    const none = await t.seedContent({ title: 'NoWindow' })
    await t.db.insert(licenseWindow).values([
      { contentId: expired.id, startsAt: past, endsAt: past },
      { contentId: expired.id, startsAt: past, endsAt: past },
      { contentId: draft.id, startsAt: past, endsAt: past },
      { contentId: live.id, startsAt: past, endsAt: future },
    ])
    const n = await t.app.get(ComplianceService).unpublishExpiredLicenses()
    expect(n).toBe(2)
    const status = async (id: string) =>
      (await t.db.select().from(content).where(eq(content.id, id)))[0]!.status
    expect(await status(expired.id)).toBe('ARCHIVED')
    expect(await status(draft.id)).toBe('DRAFT')
    expect(await status(live.id)).toBe('PUBLISHED')
    expect(await status(none.id)).toBe('PUBLISHED')
    expect(await t.app.get(ComplianceService).unpublishExpiredLicenses()).toBe(2)
  })
})
