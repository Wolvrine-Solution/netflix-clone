import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { asset, caption, eq, outboxEvent, videoFile } from '@netflix/db'
import { createTestApp, type TestApp } from '../../../test/harness'
import { AssetsService } from './assets.service'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

async function admin() {
  const u = await t.seedUser({ role: 'ADMIN' })
  return t.token(u.id)
}

describe('authorization', () => {
  it('401 anonymous, 403 non-admin on every route', async () => {
    const u = await t.seedUser()
    const token = await t.token(u.id)
    for (const [m, url] of [
      ['POST', '/api/v1/assets/upload-urls'],
      ['POST', '/api/v1/assets/a1/transcode'],
      ['GET', '/api/v1/assets/c1'],
      ['POST', '/api/v1/assets/c1/captions'],
    ] as const) {
      expect((await t.request(m, url)).status).toBe(401)
      expect((await t.request(m, url, { token })).status).toBe(403)
    }
  })
})

describe('POST /api/v1/assets/upload-urls', () => {
  it('creates an UPLOADED asset and returns one presigned-style url per part', async () => {
    const token = await admin()
    const c = await t.seedContent()
    const res = await t.request('POST', '/api/v1/assets/upload-urls', {
      token,
      body: { contentId: c.id, parts: 3 },
    })
    expect(res.status).toBe(200)
    const d = res.body.data
    expect(d.key).toMatch(new RegExp(`^uploads/${c.id}/`))
    expect(d.urls.map((u: { partNumber: number }) => u.partNumber)).toEqual([1, 2, 3])
    expect(d.urls[0].url).toContain(`/${d.key}?part=1`)
    const [row] = await t.db.select().from(asset).where(eq(asset.id, d.assetId))
    expect(row).toMatchObject({ status: 'UPLOADED', contentId: c.id, sourceKey: d.key })
  })

  it('defaults to one part and validates the body', async () => {
    const token = await admin()
    const c = await t.seedContent()
    const one = await t.request('POST', '/api/v1/assets/upload-urls', {
      token,
      body: { contentId: c.id },
    })
    expect(one.body.data.urls).toHaveLength(1)
    for (const body of [
      {},
      { contentId: 'c', parts: 0 },
      { contentId: 'c', parts: 11 },
      { contentId: 'c', parts: 1.5 },
    ]) {
      expect((await t.request('POST', '/api/v1/assets/upload-urls', { token, body })).status).toBe(
        400
      )
    }
  })
})

describe('unknown content', () => {
  it('404s instead of failing on the foreign key', async () => {
    const res = await t.request('POST', '/api/v1/assets/upload-urls', {
      token: await admin(),
      body: { contentId: 'ghost' },
    })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Content not found')
  })
})

describe('transcode pipeline', () => {
  it('runs UPLOADED -> READY, publishes renditions and emits content.ready once', async () => {
    const token = await admin()
    const c = await t.seedContent()
    const up = await t.request('POST', '/api/v1/assets/upload-urls', {
      token,
      body: { contentId: c.id },
    })
    const res = await t.request('POST', `/api/v1/assets/${up.body.data.assetId}/transcode`, {
      token,
    })
    expect(res.status).toBe(200)
    const a = res.body.data
    const base = up.body.data.key.replace(/^uploads\//, '')
    expect(a).toMatchObject({
      status: 'READY',
      hlsUrl: `https://cdn.example.com/vod/${base}/master.m3u8`,
      dashUrl: `https://cdn.example.com/vod/${base}/manifest.mpd`,
      manifestUrl: `https://cdn.example.com/vod/${base}/master.m3u8`,
      drmKeyId: `drm-${a.id}`,
    })
    const files = await t.db.select().from(videoFile).where(eq(videoFile.contentId, c.id))
    expect(files.map((f) => [f.quality, f.isDefault, f.format]).sort()).toEqual([
      ['Q_1080P', true, 'hls'],
      ['Q_720P', false, 'hls'],
    ])
    expect(files.find((f) => f.quality === 'Q_720P')!.url).toContain('/720p.m3u8')
    const ready = await t.db.select().from(outboxEvent)
    expect(ready).toHaveLength(1)
    expect(ready[0]).toMatchObject({
      eventType: 'content.ready',
      contentId: c.id,
      payload: { assetId: a.id },
    })
  })

  it('404s for an unknown asset', async () => {
    const res = await t.request('POST', '/api/v1/assets/nope/transcode', { token: await admin() })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Asset not found')
  })
})

describe('AssetsService.advanceAsset state transitions', () => {
  it('emits an outbox event only when reaching READY, and records failures', async () => {
    const svc = t.app.get(AssetsService)
    const c = await t.seedContent()
    const created = await svc.createAsset(c.id, 'uploads/x/y')
    expect(created.status).toBe('UPLOADED')

    expect((await svc.advanceAsset(created.id, 'TRANSCODING')).status).toBe('TRANSCODING')
    expect(
      (await svc.advanceAsset(created.id, 'PACKAGED', { hlsUrl: 'h', dashUrl: 'd' })).hlsUrl
    ).toBe('h')
    expect(await t.db.select().from(outboxEvent)).toHaveLength(0)

    await svc.advanceAsset(created.id, 'READY', { drmKeyId: 'k' })
    expect(await t.db.select().from(outboxEvent)).toHaveLength(1)

    const failed = await svc.advanceAsset(created.id, 'FAILED', { error: 'boom' })
    expect(failed).toMatchObject({ status: 'FAILED', error: 'boom' })
    expect(await t.db.select().from(outboxEvent)).toHaveLength(1)
  })

  it('does not emit content.ready for an asset without content, and 404s unknown ids', async () => {
    const svc = t.app.get(AssetsService)
    const [orphan] = await t.db.insert(asset).values({ sourceKey: 'k' }).returning()
    await svc.advanceAsset(orphan!.id, 'READY')
    expect(await t.db.select().from(outboxEvent)).toHaveLength(0)
    await expect(svc.advanceAsset('missing', 'READY')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('GET /api/v1/assets/:contentId and captions', () => {
  it("lists a content item's assets newest first", async () => {
    const token = await admin()
    const c = await t.seedContent()
    await t.db
      .insert(asset)
      .values({ contentId: c.id, sourceKey: 'old', createdAt: new Date(Date.now() - 5000) })
    await t.db.insert(asset).values({ contentId: c.id, sourceKey: 'new' })
    const other = await t.seedContent()
    await t.db.insert(asset).values({ contentId: other.id, sourceKey: 'x' })
    const res = await t.request('GET', `/api/v1/assets/${c.id}`, { token })
    expect(res.body.data.map((a: { sourceKey: string }) => a.sourceKey)).toEqual(['new', 'old'])
  })

  it('adds a caption and validates language/url', async () => {
    const token = await admin()
    const c = await t.seedContent()
    const ok = await t.request('POST', `/api/v1/assets/${c.id}/captions`, {
      token,
      body: { language: 'fr', url: 'https://cdn.test/fr.vtt' },
    })
    expect(ok.status).toBe(200)
    expect(ok.body.data).toMatchObject({
      contentId: c.id,
      language: 'fr',
      url: 'https://cdn.test/fr.vtt',
    })
    expect(await t.db.select().from(caption)).toHaveLength(1)
    expect(
      (
        await t.request('POST', `/api/v1/assets/${c.id}/captions`, {
          token,
          body: { language: 'fr', url: 'not a url' },
        })
      ).status
    ).toBe(400)
    expect(
      (
        await t.request('POST', `/api/v1/assets/${c.id}/captions`, {
          token,
          body: { url: 'https://x.test/a.vtt' },
        })
      ).status
    ).toBe(400)
  })
})
