import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  content,
  eventEntitlement,
  licenseWindow,
  liveChannel,
  liveEvent,
  purchase,
  user,
} from '@netflix/db'
import { createTestDb, type TestDb } from '@netflix/db/testing'
import { seedSubscription } from '../playback/playback.fixtures'
import { EntitlementsService, getPlanStreamLimit } from './entitlements.service'

let t: TestDb
let svc: EntitlementsService
beforeAll(async () => {
  t = await createTestDb()
  svc = new EntitlementsService(t.db)
})
afterAll(() => t.close())
beforeEach(() => t.reset())

async function mkUser() {
  const [u] = await t.db
    .insert(user)
    .values({ email: `${Math.random()}@t.dev` })
    .returning()
  return u!
}
async function mkContent(o: Partial<typeof content.$inferInsert> = {}) {
  const [c] = await t.db
    .insert(content)
    .values({
      mediaType: 'movie',
      title: 'T',
      description: 'd',
      posterPath: '',
      backdropPath: '',
      releaseDate: '',
      rating: 1,
      ...o,
    })
    .returning()
  return c!
}
async function mkEvent() {
  const [ch] = await t.db
    .insert(liveChannel)
    .values({ name: 'c', slug: `c${Math.random()}` })
    .returning()
  const [ev] = await t.db
    .insert(liveEvent)
    .values({ channelId: ch!.id, title: 'E', scheduledStart: new Date() })
    .returning()
  return ev!
}

describe('plan limits', () => {
  it('maps plans to concurrent stream limits', () => {
    expect([
      getPlanStreamLimit('BASIC'),
      getPlanStreamLimit('STANDARD'),
      getPlanStreamLimit('PREMIUM'),
    ]).toEqual([1, 2, 4])
  })
})

describe('subscription gate', () => {
  it('denies users without a subscription', async () => {
    const u = await mkUser()
    expect(await svc.can(u.id, 'play', {})).toEqual({
      allowed: false,
      reason: 'No active subscription',
    })
  })

  it.each(['CANCELED', 'PAST_DUE'] as const)('denies a %s subscription', async (status) => {
    const u = await mkUser()
    await seedSubscription(t.db, u.id, 'PREMIUM', status)
    expect((await svc.can(u.id, 'play', {})).allowed).toBe(false)
  })

  it('allows ACTIVE and TRIALING and caps quality by plan', async () => {
    const [a, b, c] = [await mkUser(), await mkUser(), await mkUser()]
    await seedSubscription(t.db, a.id, 'BASIC', 'ACTIVE')
    await seedSubscription(t.db, b.id, 'STANDARD', 'TRIALING')
    await seedSubscription(t.db, c.id, 'PREMIUM', 'ACTIVE')
    expect(await svc.can(a.id, 'play', {})).toEqual({ allowed: true, qualityCap: '720p' })
    expect(await svc.can(b.id, 'play', {})).toEqual({ allowed: true, qualityCap: '1080p' })
    expect(await svc.can(c.id, 'play', {})).toEqual({ allowed: true, qualityCap: '4k' })
  })

  it('only PREMIUM may download', async () => {
    const [s, p] = [await mkUser(), await mkUser()]
    await seedSubscription(t.db, s.id, 'STANDARD')
    await seedSubscription(t.db, p.id, 'PREMIUM')
    expect(await svc.can(s.id, 'download', {})).toEqual({
      allowed: false,
      reason: 'Downloads not included in plan',
    })
    expect((await svc.can(p.id, 'download', {})).allowed).toBe(true)
  })
})

describe('content gate', () => {
  it('denies missing and unpublished content', async () => {
    const u = await mkUser()
    await seedSubscription(t.db, u.id)
    const draft = await mkContent({ status: 'DRAFT' })
    expect(await svc.can(u.id, 'play', { contentId: 'nope' })).toMatchObject({
      allowed: false,
      reason: 'Content unavailable',
    })
    expect(await svc.can(u.id, 'play', { contentId: draft.id })).toMatchObject({
      allowed: false,
      reason: 'Content unavailable',
    })
  })

  it('enforces license windows', async () => {
    const u = await mkUser()
    await seedSubscription(t.db, u.id)
    const expired = await mkContent()
    const open = await mkContent()
    const day = 86_400_000
    await t.db.insert(licenseWindow).values([
      {
        contentId: expired.id,
        startsAt: new Date(Date.now() - 3 * day),
        endsAt: new Date(Date.now() - day),
      },
      {
        contentId: open.id,
        startsAt: new Date(Date.now() - day),
        endsAt: new Date(Date.now() + day),
      },
    ])
    expect(await svc.can(u.id, 'play', { contentId: expired.id })).toMatchObject({
      allowed: false,
      reason: 'Outside license window',
    })
    expect((await svc.can(u.id, 'play', { contentId: open.id })).allowed).toBe(true)
  })

  it('allows content with no license windows and honours purchases', async () => {
    const u = await mkUser()
    await seedSubscription(t.db, u.id, 'BASIC')
    const c = await mkContent()
    await t.db
      .insert(purchase)
      .values({ userId: u.id, contentId: c.id, type: 'TVOD', amountCents: 499 })
    expect(await svc.can(u.id, 'play', { contentId: c.id })).toEqual({
      allowed: true,
      qualityCap: '720p',
    })
  })
})

describe('live events', () => {
  it('BASIC needs an entitlement or purchase; higher plans do not', async () => {
    const [basic, std] = [await mkUser(), await mkUser()]
    await seedSubscription(t.db, basic.id, 'BASIC')
    await seedSubscription(t.db, std.id, 'STANDARD')
    const ev = await mkEvent()
    expect(await svc.can(basic.id, 'live', { eventId: ev.id })).toEqual({
      allowed: false,
      reason: 'Event not entitled',
    })
    expect((await svc.can(std.id, 'live', { eventId: ev.id })).allowed).toBe(true)

    await t.db.insert(eventEntitlement).values({ eventId: ev.id, userId: basic.id })
    expect((await svc.can(basic.id, 'live', { eventId: ev.id })).allowed).toBe(true)
  })

  it('a PPV purchase entitles a BASIC user', async () => {
    const u = await mkUser()
    await seedSubscription(t.db, u.id, 'BASIC')
    const ev = await mkEvent()
    await t.db
      .insert(purchase)
      .values({ userId: u.id, eventId: ev.id, type: 'PPV', amountCents: 999 })
    expect((await svc.can(u.id, 'live', { eventId: ev.id })).allowed).toBe(true)
  })
})
