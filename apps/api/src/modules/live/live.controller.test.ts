import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { content, eq, liveChannel, liveEvent, outboxEvent } from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'
import { seedSubscription } from '../playback/playback.fixtures'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

async function channel(o: Partial<typeof liveChannel.$inferInsert> = {}) {
  const [c] = await t.db
    .insert(liveChannel)
    .values({ name: 'News', slug: `news-${Math.random()}`, ...o })
    .returning()
  return c!
}
async function event(channelId: string, o: Partial<typeof liveEvent.$inferInsert> = {}) {
  const [e] = await t.db
    .insert(liveEvent)
    .values({
      channelId,
      title: 'Match',
      scheduledStart: new Date(),
      playbackUrl: 'https://live.test/m.m3u8',
      ...o,
    })
    .returning()
  return e!
}
async function admin() {
  const u = await t.seedUser({ role: 'ADMIN' })
  return t.token(u.id)
}

describe('GET /api/v1/live/channels', () => {
  it('lists active channels with at most their upcoming/live events in start order', async () => {
    const ch = await channel()
    await channel({ isActive: false })
    const now = Date.now()
    await event(ch.id, { title: 'later', scheduledStart: new Date(now + 2000) })
    await event(ch.id, { title: 'sooner', scheduledStart: new Date(now + 1000), status: 'LIVE' })
    await event(ch.id, { title: 'done', status: 'ENDED' })
    const res = await t.request('GET', '/api/v1/live/channels')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].events.map((e: { title: string }) => e.title)).toEqual([
      'sooner',
      'later',
    ])
  })

  it('caps events at 10 per channel', async () => {
    const ch = await channel()
    for (let i = 0; i < 12; i++)
      await event(ch.id, { scheduledStart: new Date(Date.now() + i * 1000) })
    const res = await t.request('GET', '/api/v1/live/channels')
    expect(res.body.data[0].events).toHaveLength(10)
  })
})

describe('GET /api/v1/live/events/:eventId', () => {
  it('returns the event with its channel, or 404', async () => {
    const ch = await channel({ name: 'Sports' })
    const ev = await event(ch.id)
    const res = await t.request('GET', `/api/v1/live/events/${ev.id}`)
    expect(res.body.data.channel.name).toBe('Sports')
    const miss = await t.request('GET', '/api/v1/live/events/nope')
    expect(miss.status).toBe(404)
    expect(miss.body.message).toBe('Event not found')
  })
})

describe('POST /api/v1/live/events/:eventId/playback', () => {
  it('requires authentication', async () => {
    expect((await t.request('POST', '/api/v1/live/events/x/playback')).status).toBe(401)
  })

  it('404s for unknown events', async () => {
    const u = await t.seedUser()
    expect(
      (await t.request('POST', '/api/v1/live/events/x/playback', { token: await t.token(u.id) }))
        .status
    ).toBe(404)
  })

  it('enforces blackout and allow-list regions with 403', async () => {
    const u = await t.seedUser()
    const token = await t.token(u.id)
    const ch = await channel()
    const black = await event(ch.id, { blackoutRegions: ['US'] })
    const only = await event(ch.id, { geoRestricted: ['CA'] })
    const blocked = await t.request('POST', `/api/v1/live/events/${black.id}/playback?region=US`, {
      token,
    })
    expect(blocked.status).toBe(403)
    expect(blocked.body.message).toBe('Geo-restricted')
    expect(
      (await t.request('POST', `/api/v1/live/events/${only.id}/playback?region=US`, { token }))
        .status
    ).toBe(403)
    expect(
      (await t.request('POST', `/api/v1/live/events/${only.id}/playback?region=CA`, { token }))
        .status
    ).toBe(200)
    expect(
      (await t.request('POST', `/api/v1/live/events/${black.id}/playback`, { token })).status
    ).toBe(200)
  })

  it('reports live vs slate mode with slate urls and dvr window', async () => {
    const u = await t.seedUser()
    const token = await t.token(u.id)
    const ch = await channel()
    const live = await event(ch.id, {
      status: 'LIVE',
      slatePreUrl: 'pre',
      slatePostUrl: 'post',
      dvrWindowSec: 600,
    })
    const sched = await event(ch.id)
    const a = await t.request('POST', `/api/v1/live/events/${live.id}/playback`, { token })
    expect(a.body.data).toEqual({
      manifestUrl: 'https://live.test/m.m3u8',
      mode: 'live',
      slatePreUrl: 'pre',
      slatePostUrl: 'post',
      dvrWindowSec: 600,
    })
    expect(
      (await t.request('POST', `/api/v1/live/events/${sched.id}/playback`, { token })).body.data
        .mode
    ).toBe('slate')
  })

  it('serves an archived event as a DVR playback token (needs entitlement)', async () => {
    const u = await t.seedUser()
    const token = await t.token(u.id)
    const ch = await channel()
    const replay = await t.seedContent({ videoUrl: 'https://cdn.test/replay.mp4' })
    const ev = await event(ch.id, { status: 'ENDED', archivedContentId: replay.id })

    const denied = await t.request('POST', `/api/v1/live/events/${ev.id}/playback`, { token })
    expect(denied.status).toBe(403)

    await seedSubscription(t.db, u.id)
    const ok = await t.request('POST', `/api/v1/live/events/${ev.id}/playback`, { token })
    expect(ok.status).toBe(200)
    expect(ok.body.data.mode).toBe('dvr')
    expect(ok.body.data.manifestUrl).toContain('https://cdn.test/replay.mp4?exp=')
  })
})

describe('admin: create and archive', () => {
  const body = (channelId: string) => ({
    channelId,
    title: 'Final',
    scheduledStart: '2030-01-01T10:00:00.000Z',
  })

  it('rejects non-admins and anonymous callers', async () => {
    const u = await t.seedUser()
    expect((await t.request('POST', '/api/v1/live/events', { body: body('c') })).status).toBe(401)
    expect(
      (
        await t.request('POST', '/api/v1/live/events', {
          token: await t.token(u.id),
          body: body('c'),
        })
      ).status
    ).toBe(403)
  })

  it('creates an event (201), validating the payload and the channel', async () => {
    const token = await admin()
    const ch = await channel()
    const ok = await t.request('POST', '/api/v1/live/events', {
      token,
      body: { ...body(ch.id), scheduledEnd: '2030-01-01T12:00:00.000Z' },
    })
    expect(ok.status).toBe(201)
    expect(ok.body.data).toMatchObject({ title: 'Final', status: 'SCHEDULED', channelId: ch.id })
    expect(
      (
        await t.request('POST', '/api/v1/live/events', {
          token,
          body: { ...body(ch.id), scheduledStart: 'tomorrow' },
        })
      ).status
    ).toBe(400)
    expect(
      (await t.request('POST', '/api/v1/live/events', { token, body: { title: 'x' } })).status
    ).toBe(400)
    expect(
      (await t.request('POST', '/api/v1/live/events', { token, body: body('missing') })).status
    ).toBe(404)
  })

  it('archives an event into VOD content plus an outbox event, idempotently', async () => {
    const token = await admin()
    const ch = await channel()
    const ev = await event(ch.id, { title: 'Derby', description: 'big game' })
    const first = await t.request('POST', `/api/v1/live/events/${ev.id}/archive`, { token })
    expect(first.status).toBe(200)
    const contentId = first.body.data.contentId
    expect(contentId).toEqual(expect.any(String))

    const [c] = await t.db.select().from(content).where(eq(content.id, contentId))
    expect(c).toMatchObject({
      title: 'Derby (Replay)',
      description: 'big game',
      status: 'PUBLISHED',
      videoUrl: 'https://live.test/m.m3u8',
    })
    const [stored] = await t.db.select().from(liveEvent).where(eq(liveEvent.id, ev.id))
    expect(stored).toMatchObject({ status: 'ENDED', archivedContentId: contentId })
    const out = await t.db.select().from(outboxEvent)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      eventType: 'content.archived_from_live',
      contentId,
      payload: { eventId: ev.id },
    })

    const again = await t.request('POST', `/api/v1/live/events/${ev.id}/archive`, { token })
    expect(again.body.data.contentId).toBe(contentId)
    expect(await t.db.select().from(outboxEvent)).toHaveLength(1)
  })

  it('404s when archiving an unknown event', async () => {
    const res = await t.request('POST', '/api/v1/live/events/nope/archive', {
      token: await admin(),
    })
    expect(res.status).toBe(404)
  })
})
