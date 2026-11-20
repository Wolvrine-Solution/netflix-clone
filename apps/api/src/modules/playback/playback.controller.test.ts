import { createHmac } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { asset, caption, eq, playbackSession, qoeEvent, videoFile, watchHistory } from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'
import { seedSubscription } from './playback.fixtures'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

const SECRET = process.env['NEXTAUTH_SECRET']! // no CDN_SIGNING_SECRET in tests

function verifySigned(signed: string) {
  const u = new URL(signed)
  const exp = u.searchParams.get('exp')!
  const sig = u.searchParams.get('sig')!
  u.searchParams.delete('exp')
  u.searchParams.delete('sig')
  const unsigned = u.toString().replace(/\?$/, '')
  return sig === createHmac('sha256', SECRET).update(`${unsigned}:${exp}`).digest('hex')
}

async function viewer(plan: 'BASIC' | 'STANDARD' | 'PREMIUM' = 'STANDARD') {
  const u = await t.seedUser()
  await seedSubscription(t.db, u.id, plan)
  return { u, token: await t.token(u.id) }
}

describe('POST /api/v1/playback/:contentId', () => {
  it('requires authentication', async () => {
    expect((await t.request('POST', '/api/v1/playback/x')).status).toBe(401)
  })

  it('403s with the entitlement reason when there is no subscription', async () => {
    const u = await t.seedUser()
    const c = await t.seedContent()
    const res = await t.request('POST', `/api/v1/playback/${c.id}`, { token: await t.token(u.id) })
    expect(res.status).toBe(403)
    expect(res.body.message).toBe('No active subscription')
  })

  it('403s for unavailable content (draft) and unknown content', async () => {
    const { token } = await viewer()
    const draft = await t.seedContent({ status: 'DRAFT' })
    expect((await t.request('POST', `/api/v1/playback/${draft.id}`, { token })).body.message).toBe(
      'Content unavailable'
    )
    expect((await t.request('POST', '/api/v1/playback/missing', { token })).status).toBe(403)
  })

  it('returns a signed default-rendition manifest, a session and start position 0', async () => {
    const { u, token } = await viewer('STANDARD')
    const c = await t.seedContent()
    await t.db.insert(videoFile).values([
      { contentId: c.id, url: 'https://cdn.test/a.m3u8', quality: 'Q_720P' },
      { contentId: c.id, url: 'https://cdn.test/b.m3u8', quality: 'Q_1080P', isDefault: true },
    ])
    const res = await t.request('POST', `/api/v1/playback/${c.id}`, {
      token,
      body: { deviceId: 'tv' },
    })
    expect(res.status).toBe(200)
    const d = res.body.data
    expect(d.manifestUrl).toContain('https://cdn.test/b.m3u8?exp=')
    expect(verifySigned(d.manifestUrl)).toBe(true)
    expect(d).toMatchObject({ startPosition: 0, qualityCap: '1080p' })
    const [session] = await t.db
      .select()
      .from(playbackSession)
      .where(eq(playbackSession.id, d.sessionId))
    expect(session).toMatchObject({ userId: u.id, deviceId: 'tv', qualityCap: '1080p' })
  })

  it('prefers a READY asset (HLS + DASH + DRM routes) and signs captions', async () => {
    const { token } = await viewer()
    const c = await t.seedContent({ videoUrl: 'https://cdn.test/legacy.mp4' })
    await t.db.insert(asset).values([
      {
        contentId: c.id,
        sourceKey: 'k1',
        status: 'TRANSCODING',
        hlsUrl: 'https://cdn.test/skip.m3u8',
      },
      {
        contentId: c.id,
        sourceKey: 'k2',
        status: 'READY',
        hlsUrl: 'https://cdn.test/hls.m3u8',
        dashUrl: 'https://cdn.test/m.mpd',
        drmKeyId: 'kid',
      },
    ])
    await t.db
      .insert(caption)
      .values({ contentId: c.id, language: 'en', url: 'https://cdn.test/en.vtt' })
    const d = (await t.request('POST', `/api/v1/playback/${c.id}`, { token })).body.data
    expect(d.manifestUrl).toContain('https://cdn.test/hls.m3u8?')
    expect(verifySigned(d.dashUrl)).toBe(true)
    expect(d.captions).toHaveLength(1)
    expect(d.captions[0].language).toBe('en')
    expect(verifySigned(d.captions[0].url)).toBe(true)
    expect(d.drm).toEqual({
      widevine: `/api/v1/playback/drm/widevine/${c.id}`,
      fairplay: `/api/v1/playback/drm/fairplay/${c.id}`,
      playready: `/api/v1/playback/drm/playready/${c.id}`,
    })
  })

  it('falls back to content.videoUrl, then to the sample clip', async () => {
    const { token } = await viewer()
    const withUrl = await t.seedContent({ videoUrl: 'https://cdn.test/legacy.mp4' })
    const bare = await t.seedContent()
    expect(
      (await t.request('POST', `/api/v1/playback/${withUrl.id}`, { token })).body.data.manifestUrl
    ).toContain('https://cdn.test/legacy.mp4?')
    expect(
      (await t.request('POST', `/api/v1/playback/${bare.id}`, { token })).body.data.manifestUrl
    ).toContain('BigBuckBunny.mp4?')
  })

  it('resumes from watch history for the given profile', async () => {
    const { u, token } = await viewer()
    const p = await t.seedProfile(u.id)
    const c = await t.seedContent()
    await t.db.insert(watchHistory).values({ profileId: p.id, contentId: c.id, progress: 321.5 })
    const d = (
      await t.request('POST', `/api/v1/playback/${c.id}`, { token, body: { profileId: p.id } })
    ).body.data
    expect(d.startPosition).toBe(321.5)
  })

  it('BASIC plan downgrades a 4k rendition path to 720p', async () => {
    const { token } = await viewer('BASIC')
    const c = await t.seedContent({ videoUrl: 'https://cdn.test/4k/master.m3u8' })
    const d = (await t.request('POST', `/api/v1/playback/${c.id}`, { token })).body.data
    expect(d.qualityCap).toBe('720p')
    expect(d.manifestUrl).toContain('https://cdn.test/720p/master.m3u8?')
  })

  it('enforces the concurrent stream limit (BASIC: second playback evicts the first)', async () => {
    const { u, token } = await viewer('BASIC')
    const c = await t.seedContent()
    const first = (await t.request('POST', `/api/v1/playback/${c.id}`, { token })).body.data
      .sessionId
    const second = (await t.request('POST', `/api/v1/playback/${c.id}`, { token })).body.data
      .sessionId
    const live = await t.db.select().from(playbackSession).where(eq(playbackSession.userId, u.id))
    expect(live.map((s) => s.id)).toEqual([second])
    expect(live.map((s) => s.id)).not.toContain(first)
  })

  it('rejects an invalid body with 400', async () => {
    const { token } = await viewer()
    const c = await t.seedContent()
    const res = await t.request('POST', `/api/v1/playback/${c.id}`, {
      token,
      body: { profileId: 5 },
    })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Validation error/)
  })
})

describe('heartbeat, qoe and drm routes', () => {
  it('heartbeat returns ok for the owner and 404 otherwise', async () => {
    const { token } = await viewer()
    const c = await t.seedContent()
    const sessionId = (await t.request('POST', `/api/v1/playback/${c.id}`, { token })).body.data
      .sessionId
    const ok = await t.request('POST', `/api/v1/playback/sessions/${sessionId}/heartbeat`, {
      token,
    })
    expect(ok.status).toBe(200)
    expect(ok.body).toEqual({ data: { ok: true } })
    const other = await t.seedUser()
    const miss = await t.request('POST', `/api/v1/playback/sessions/${sessionId}/heartbeat`, {
      token: await t.token(other.id),
    })
    expect(miss.status).toBe(404)
    expect(miss.body.message).toBe('Session not found')
  })

  it('records QoE events (and is not swallowed by /:contentId)', async () => {
    const { u, token } = await viewer()
    const res = await t.request('POST', '/api/v1/playback/qoe', {
      token,
      body: { contentId: 'c1', eventType: 'rebuffer', metadata: { ms: 120 } },
    })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ data: { recorded: true } })
    const [row] = await t.db.select().from(qoeEvent)
    expect(row).toMatchObject({
      userId: u.id,
      contentId: 'c1',
      eventType: 'rebuffer',
      metadata: { ms: 120 },
    })
  })

  it('validates the QoE body', async () => {
    const { token } = await viewer()
    expect(
      (await t.request('POST', '/api/v1/playback/qoe', { token, body: { eventType: 'x' } })).status
    ).toBe(400)
  })

  it('returns the DRM license endpoint descriptor', async () => {
    const { token } = await viewer()
    const res = await t.request('GET', '/api/v1/playback/drm/widevine/c9', { token })
    expect(res.body).toEqual({
      data: { licenseUrl: '/api/v1/playback/drm/license/widevine/c9', provider: 'widevine' },
    })
  })

  it('is v1 only', async () => {
    const { token } = await viewer()
    expect((await t.request('POST', '/api/playback/x', { token })).status).toBe(404)
  })
})
