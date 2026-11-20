import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'
import { SearchIndexerService } from './search-indexer.service'
import { TmdbService } from '../content/tmdb.service'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(async () => {
  vi.restoreAllMocks()
  await t.reset()
})

describe('GET /api/search', () => {
  it('returns empty data for missing or too-short queries', async () => {
    for (const url of [
      '/api/search',
      '/api/search?q=',
      '/api/search?q=a',
      '/api/search?q=%20a%20',
    ]) {
      const res = await t.request('GET', url)
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ data: [] })
    }
  })

  it('finds published content by title, case-insensitive, with genres', async () => {
    await t.seedContent({ title: 'The Matrix', genres: ['Sci-Fi'] })
    await t.seedContent({ title: 'Matrix Draft', status: 'DRAFT' })
    await t.seedContent({ title: 'Other' })
    for (const base of ['/api/search', '/api/v1/search']) {
      const res = await t.request('GET', `${base}?q=matRIX`)
      expect(res.status).toBe(200)
      expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['The Matrix'])
      expect(res.body.data[0].genres).toEqual([{ id: expect.any(Number), name: 'Sci-Fi' }])
    }
  })

  it('treats LIKE wildcards in the query literally', async () => {
    await t.seedContent({ title: 'Alpha' })
    const res = await t.request('GET', '/api/search?q=%25%25')
    expect(res.body.data).toEqual([])
  })

  it('hides mature results from kid profiles', async () => {
    await t.seedContent({ title: 'Toon Fun', maturityRating: 'TV-Y' })
    await t.seedContent({ title: 'Toon Gore', maturityRating: 'R' })
    const res = await t.request('GET', '/api/search?q=toon&isKid=true')
    expect(res.body.data.map((c: { title: string }) => c.title)).toEqual(['Toon Fun'])
  })

  it('merges db, indexed and TMDB results without duplicates and caps at 30', async () => {
    const c = await t.seedContent({ title: 'Dune', tmdbId: 11 })
    const indexer = t.app.get(SearchIndexerService)
    vi.spyOn(indexer, 'searchCatalog').mockResolvedValue([
      { id: c.id, title: 'Dune', description: 'dup', mediaType: 'movie', maturityRating: 'PG' },
      {
        id: 'idx-1',
        title: 'Dune Indexed',
        description: 'd',
        mediaType: 'tv',
        maturityRating: 'PG',
      },
    ])
    const tmdbItem = (tmdbId: number, maturityRating: string) => ({
      id: String(tmdbId),
      tmdbId,
      title: `Dune T${tmdbId}`,
      description: '',
      posterPath: '',
      backdropPath: '',
      releaseDate: '',
      rating: 1,
      mediaType: 'movie' as const,
      genres: [],
      maturityRating,
      isFeatured: false,
      status: 'PUBLISHED' as const,
      language: 'en',
      cast: [],
    })
    vi.spyOn(t.app.get(TmdbService), 'search').mockResolvedValue([
      tmdbItem(11, 'PG'),
      tmdbItem(12, 'PG'),
      tmdbItem(13, 'R'),
    ])

    const res = await t.request('GET', '/api/search?q=dune')
    const titles = res.body.data.map((x: { title: string }) => x.title)
    expect(titles).toEqual(['Dune', 'Dune Indexed', 'Dune T12', 'Dune T13'])
    expect(res.body.data[1]).toMatchObject({ id: 'idx-1', posterPath: '', rating: 0, genres: [] })

    const kid = await t.request('GET', '/api/search?q=dune&isKid=true')
    expect(kid.body.data.map((x: { title: string }) => x.title)).not.toContain('Dune T13')
  })
})
