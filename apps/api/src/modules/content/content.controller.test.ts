import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

describe('GET /api/content', () => {
  it('lists only published content, best rated first, with genres', async () => {
    await t.seedContent({ title: 'Low', rating: 5, genres: ['Drama'] })
    await t.seedContent({ title: 'High', rating: 9, genres: ['Drama', 'Action'] })
    await t.seedContent({ title: 'Hidden', status: 'DRAFT', rating: 10 })

    const res = await t.request('GET', '/api/content')
    expect(res.status).toBe(200)
    expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['High', 'Low'])
    expect(res.body.totalResults).toBe(2)
    expect(res.body.data[0].genres[0].genre.name).toMatch(/Drama|Action/)
    expect(res.headers['cache-control']).toContain('public')
  })

  it('filters by media type, genre (case-insensitive) and paginates', async () => {
    await t.seedContent({ title: 'M1', mediaType: 'movie', genres: ['Comedy'] })
    await t.seedContent({ title: 'T1', mediaType: 'tv', genres: ['Comedy'] })
    await t.seedContent({ title: 'T2', mediaType: 'tv', genres: ['Horror'], rating: 1 })

    const tv = await t.request('GET', '/api/content?mediaType=tv')
    expect(tv.body.totalResults).toBe(2)

    const comedy = await t.request('GET', '/api/content?genre=comed')
    expect(comedy.body.data.map((c: { title: string }) => c.title).sort()).toEqual(['M1', 'T1'])

    const page = await t.request('GET', '/api/content?limit=1&page=2')
    expect(page.body.data).toHaveLength(1)
    expect(page.body.totalPages).toBe(3)
  })

  it('hides mature content from kid profiles', async () => {
    const u = await t.seedUser()
    const kid = await t.seedProfile(u.id, { isKid: true })
    await t.seedContent({ title: 'Kids', maturityRating: 'TV-Y' })
    await t.seedContent({ title: 'Adult', maturityRating: 'R' })
    const token = await t.token(u.id)

    const res = await t.request('GET', `/api/content?profileId=${kid.id}`, { token })
    expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['Kids'])
  })
})

describe('GET /api/content/featured and /:id', () => {
  it('returns the featured published item or null', async () => {
    expect((await t.request('GET', '/api/content/featured')).body.data).toBeNull()
    await t.seedContent({ title: 'Star', isFeatured: true })
    expect((await t.request('GET', '/api/content/featured')).body.data.title).toBe('Star')
  })

  it('returns detail with default-first video files, 404 when missing', async () => {
    const c = await t.seedContent({ title: 'Detail' })
    const { videoFile } = await import('@netflix/db')
    await t.db.insert(videoFile).values([
      { contentId: c.id, url: 'a.mp4', quality: 'Q_720P', size: 123n },
      { contentId: c.id, url: 'b.mp4', quality: 'Q_1080P', isDefault: true },
    ])
    const res = await t.request('GET', `/api/content/${c.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.videoFiles[0]).toMatchObject({ url: 'b.mp4', isDefault: true })
    expect(res.body.data.videoFiles[1].size).toBe(123)

    expect((await t.request('GET', '/api/content/nope')).status).toBe(404)
  })

  it('blocks kid profiles from mature detail pages', async () => {
    const u = await t.seedUser()
    const kid = await t.seedProfile(u.id, { isKid: true })
    const c = await t.seedContent({ maturityRating: 'R' })
    const res = await t.request('GET', `/api/content/${c.id}?profileId=${kid.id}`, {
      token: await t.token(u.id),
    })
    expect(res.status).toBe(403)
  })
})
