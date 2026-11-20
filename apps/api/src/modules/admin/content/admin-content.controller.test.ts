import { adminLog, content, eq, genre, season, type Database } from '@netflix/db'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
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
  const a = await adminAuth(t)
  token = a.token
  adminId = a.admin.id
})
afterEach(() => vi.restoreAllMocks())

const valid = {
  title: 'New Movie',
  mediaType: 'movie',
  description: 'desc',
  posterPath: '/p.jpg',
  backdropPath: '/b.jpg',
  releaseDate: '2024-01-01',
  rating: 7.5,
}
const call = (method: Parameters<TestApp['request']>[0], url: string, body?: unknown) =>
  t.request(method, `/api/admin/content${url}`, { token, body })
const logs = (db: Database = t.db) => db.select().from(adminLog)

describe('POST /', () => {
  it('rejects missing required fields and out-of-range ratings with 400', async () => {
    expect((await call('POST', '', { title: 'No media type' })).status).toBe(400)
    expect((await call('POST', '', { ...valid, rating: 15 })).status).toBe(400)
    expect(await t.db.select().from(content)).toHaveLength(0)
  })

  it('creates content with defaults and writes an audit log', async () => {
    const res = await call('POST', '', valid)
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      title: 'New Movie',
      maturityRating: 'TV-MA',
      status: 'PUBLISHED',
      language: 'en',
      isFeatured: false,
      cast: [],
    })
    const [log] = await logs()
    expect(log).toMatchObject({
      adminId,
      action: 'CREATE',
      resource: 'Content',
      resourceId: res.body.data.id,
    })
  })

  it('links genres, creating unknown genre ids', async () => {
    await t.db.insert(genre).values({ id: 1, name: 'Drama' })
    const res = await call('POST', '', { ...valid, genreIds: [1, 99] })
    expect(res.status).toBe(201)
    expect(res.body.data.genres.map((g: { id: number }) => g.id).sort()).toEqual([1, 99])
    expect(await t.db.query.genre.findFirst({ where: eq(genre.id, 99) })).toBeTruthy()
  })
})

describe('GET /', () => {
  it('lists with pagination, search, mediaType and status filters', async () => {
    await t.seedContent({ title: 'Alpha Movie', mediaType: 'movie' })
    await t.seedContent({ title: 'Beta Show', mediaType: 'tv', status: 'DRAFT' })
    await t.seedContent({ title: 'Gamma Show', mediaType: 'tv' })

    const all = await call('GET', '')
    expect(all.body.totalResults).toBe(3)
    expect((await call('GET', '?q=show')).body.totalResults).toBe(2)
    expect((await call('GET', '?mediaType=tv')).body.totalResults).toBe(2)
    expect((await call('GET', '?status=DRAFT')).body.data[0].title).toBe('Beta Show')
    const page = await call('GET', '?limit=2&page=2')
    expect(page.body.data).toHaveLength(1)
    expect(page.body.totalPages).toBe(2)
  })

  it('includes draft content (unlike the public catalog) and mapped genres', async () => {
    await t.seedContent({ title: 'Draft', status: 'DRAFT', genres: ['Drama'] })
    const res = await call('GET', '')
    expect(res.body.data[0]).toMatchObject({ title: 'Draft', status: 'DRAFT' })
    expect(res.body.data[0].genres).toEqual([expect.objectContaining({ name: 'Drama' })])
  })

  it('rejects an unknown status filter with 400', async () => {
    expect((await call('GET', '?status=NOPE')).status).toBe(400)
  })
})

describe('POST /import', () => {
  it('returns the existing record and skips TMDB when already imported', async () => {
    await t.seedContent({ title: 'Already Here', tmdbId: 999 })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const res = await call('POST', '/import', { tmdbId: 999, mediaType: 'movie' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Already imported')
    expect(res.body.data.title).toBe('Already Here')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a non-positive tmdbId', async () => {
    expect((await call('POST', '/import', { tmdbId: -5, mediaType: 'movie' })).status).toBe(400)
  })

  it('imports a movie from TMDB with genres, cast, director and trailer', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          title: 'Imported',
          overview: 'plot',
          poster_path: '/p.jpg',
          backdrop_path: '/b.jpg',
          release_date: '2020-02-02',
          vote_average: 8,
          runtime: 101,
          genres: [{ id: 28, name: 'Action' }],
          videos: { results: [{ site: 'YouTube', type: 'Trailer', key: 'yt1', official: true }] },
          credits: {
            cast: [{ name: 'A' }, { name: 'B' }],
            crew: [{ job: 'Director', name: 'Dir' }],
          },
        }),
        { status: 200 }
      )
    )
    const res = await call('POST', '/import', { tmdbId: 5, mediaType: 'movie' })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      title: 'Imported',
      rating: 0.8,
      runtime: 101,
      trailerKey: 'yt1',
      director: 'Dir',
      cast: ['A', 'B'],
      genres: [{ id: 28, name: 'Action' }],
    })
    expect((await logs())[0]).toMatchObject({ action: 'IMPORT' })
  })

  it('returns 502 when TMDB fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('no', { status: 500 }))
    expect((await call('POST', '/import', { tmdbId: 5, mediaType: 'tv' })).status).toBe(502)
  })
})

describe('GET /tmdb-search', () => {
  it('returns empty results for an empty query and filters to movie/tv', async () => {
    expect((await call('GET', '/tmdb-search')).body).toEqual({ results: [] })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            { media_type: 'movie', id: 1 },
            { media_type: 'person', id: 2 },
          ],
        })
      )
    )
    const res = await call('GET', '/tmdb-search?q=matrix')
    expect(res.body.results).toEqual([{ media_type: 'movie', id: 1 }])
  })
})

describe('GET/PUT/DELETE /:id', () => {
  it('GET returns 404 for missing content', async () => {
    expect((await call('GET', '/missing')).status).toBe(404)
  })

  it('GET returns nested seasons, episodes and numeric video sizes', async () => {
    const c = await t.seedContent({ mediaType: 'tv' })
    await call('POST', `/${c.id}/videos`, { url: 'https://x.test/a.mp4' })
    const s = await call('POST', `/${c.id}/seasons`, { seasonNumber: 1 })
    await call('POST', `/${c.id}/seasons/${s.body.data.id}/episodes`, {
      episodeNumber: 2,
      title: 'E2',
    })
    await call('POST', `/${c.id}/seasons/${s.body.data.id}/episodes`, {
      episodeNumber: 1,
      title: 'E1',
    })

    const res = await call('GET', `/${c.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.videoFiles).toHaveLength(1)
    expect(res.body.data.contentSeasons[0].episodes.map((e: { title: string }) => e.title)).toEqual(
      ['E1', 'E2']
    )
  })

  it('PUT returns 404 for missing content', async () => {
    expect((await call('PUT', '/missing', { title: 'Updated' })).status).toBe(404)
  })

  it('PUT updates only the supplied fields (no defaults re-applied) and replaces genres when sent', async () => {
    const c = await t.seedContent({
      title: 'Old',
      status: 'DRAFT',
      isFeatured: true,
      maturityRating: 'R',
      cast: ['X'],
      genres: ['Drama'],
    })
    const res = await call('PUT', `/${c.id}`, { title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({
      title: 'Updated',
      status: 'DRAFT',
      isFeatured: true,
      maturityRating: 'R',
      cast: ['X'],
    })
    expect(res.body.data.genres).toHaveLength(1) // untouched without genreIds

    await t.db.insert(genre).values({ id: 7, name: 'Comedy' })
    const swapped = await call('PUT', `/${c.id}`, { genreIds: [7] })
    expect(swapped.body.data.genres).toEqual([{ id: 7, name: 'Comedy' }])
    const cleared = await call('PUT', `/${c.id}`, { genreIds: [] })
    expect(cleared.body.data.genres).toEqual([])
    expect((await logs()).map((l) => l.action)).toEqual(['UPDATE', 'UPDATE', 'UPDATE'])
  })

  it('DELETE returns 404 for missing content and deletes + audits otherwise', async () => {
    expect((await call('DELETE', '/missing')).status).toBe(404)
    const c = await t.seedContent({ title: 'Bye' })
    const res = await call('DELETE', `/${c.id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Content deleted')
    expect(await t.db.select().from(content)).toHaveLength(0)
    expect((await logs())[0]).toMatchObject({ action: 'DELETE', details: { title: 'Bye' } })
  })
})

describe('PATCH /:id/featured', () => {
  it('unsets any previously featured content before setting the new one', async () => {
    const a = await t.seedContent({ isFeatured: true })
    const b = await t.seedContent()
    const res = await call('PATCH', `/${b.id}/featured`, { isFeatured: true })
    expect(res.status).toBe(200)
    expect(res.body.data.isFeatured).toBe(true)
    expect((await t.db.query.content.findFirst({ where: eq(content.id, a.id) }))?.isFeatured).toBe(
      false
    )
  })

  it('does not unset others when isFeatured is false', async () => {
    const a = await t.seedContent({ isFeatured: true })
    const b = await t.seedContent({ isFeatured: true })
    await call('PATCH', `/${b.id}/featured`, { isFeatured: false })
    expect((await t.db.query.content.findFirst({ where: eq(content.id, a.id) }))?.isFeatured).toBe(
      true
    )
  })

  it('returns 404 for missing content', async () => {
    expect((await call('PATCH', '/nope/featured', { isFeatured: true })).status).toBe(404)
  })
})

describe('videos', () => {
  it('adds a video, makes the newest default exclusive, and removes it', async () => {
    const c = await t.seedContent()
    const first = await call('POST', `/${c.id}/videos`, {
      url: 'https://x.test/1.mp4',
      isDefault: true,
    })
    expect(first.status).toBe(201)
    expect(first.body.data).toMatchObject({ quality: 'AUTO', isDefault: true })
    const second = await call('POST', `/${c.id}/videos`, {
      url: 'https://x.test/2.mp4',
      isDefault: true,
    })

    const detail = await call('GET', `/${c.id}`)
    const defaults = detail.body.data.videoFiles.filter((v: { isDefault: boolean }) => v.isDefault)
    expect(defaults.map((v: { id: string }) => v.id)).toEqual([second.body.data.id])

    const del = await call('DELETE', `/${c.id}/videos/${first.body.data.id}`)
    expect(del.body.message).toBe('Video file removed')
    expect((await call('DELETE', `/${c.id}/videos/${first.body.data.id}`)).status).toBe(404)
  })

  it('validates url and 404s for missing content', async () => {
    const c = await t.seedContent()
    expect((await call('POST', `/${c.id}/videos`, { url: 'not-a-url' })).status).toBe(400)
    expect((await call('POST', '/missing/videos', { url: 'https://x.test/1.mp4' })).status).toBe(
      404
    )
  })
})

describe('seasons and episodes', () => {
  it('creates, updates and deletes episodes; rejects duplicates', async () => {
    const c = await t.seedContent({ mediaType: 'tv' })
    const s = await call('POST', `/${c.id}/seasons`, { seasonNumber: 1, title: 'S1' })
    expect(s.status).toBe(201)
    expect((await call('POST', `/${c.id}/seasons`, { seasonNumber: 1 })).status).toBe(409)
    expect(await t.db.select().from(season)).toHaveLength(1)

    const base = `/${c.id}/seasons/${s.body.data.id}/episodes`
    const e = await call('POST', base, { episodeNumber: 1, title: 'Pilot' })
    expect(e.status).toBe(201)
    expect((await call('POST', base, { episodeNumber: 1, title: 'Dup' })).status).toBe(409)
    expect((await call('POST', base, { episodeNumber: 0, title: 'Bad' })).status).toBe(400)

    const upd = await call('PUT', `${base}/${e.body.data.id}`, { title: 'Pilot 2' })
    expect(upd.status).toBe(200)
    expect(upd.body.data).toMatchObject({ title: 'Pilot 2', episodeNumber: 1 })

    expect((await call('DELETE', `${base}/${e.body.data.id}`)).body.message).toBe('Episode deleted')
    expect((await call('DELETE', `${base}/${e.body.data.id}`)).status).toBe(404)
    expect((await call('PUT', `${base}/nope`, { title: 'x' })).status).toBe(404)
  })

  it('404s when the parent content or season is missing', async () => {
    expect((await call('POST', '/missing/seasons', { seasonNumber: 1 })).status).toBe(404)
    const c = await t.seedContent({ mediaType: 'tv' })
    expect(
      (await call('POST', `/${c.id}/seasons/missing/episodes`, { episodeNumber: 1, title: 'x' }))
        .status
    ).toBe(404)
  })
})
