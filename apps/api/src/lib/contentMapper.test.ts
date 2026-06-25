import { describe, it, expect } from 'vitest'
import { mapContent } from './contentMapper'

function baseContent(overrides: Partial<Parameters<typeof mapContent>[0]> = {}) {
  return {
    id: 'c1',
    tmdbId: 123,
    mediaType: 'movie',
    title: 'Test Movie',
    description: 'A movie about tests',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    trailerKey: 'yt123',
    videoUrl: 'https://example.com/video.mp4',
    releaseDate: '2024-01-01',
    rating: 8.5,
    runtime: 120,
    seasons: null,
    episodes: null,
    maturityRating: 'PG-13',
    isFeatured: false,
    status: 'PUBLISHED',
    language: 'en',
    country: 'US',
    studio: 'Test Studio',
    director: 'Jane Doe',
    tagline: 'A tagline',
    cast: ['Actor A', 'Actor B'],
    genres: [{ genre: { id: 1, name: 'Action' } }, { genre: { id: 2, name: 'Drama' } }],
    ...overrides,
  }
}

describe('mapContent', () => {
  it('maps a fully populated movie record', () => {
    const result = mapContent(baseContent())

    expect(result).toMatchObject({
      id: 'c1',
      tmdbId: 123,
      title: 'Test Movie',
      mediaType: 'movie',
      status: 'PUBLISHED',
      genres: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Drama' },
      ],
    })
  })

  it('converts null tmdbId to undefined', () => {
    const result = mapContent(baseContent({ tmdbId: null }))
    expect(result.tmdbId).toBeUndefined()
  })

  it('converts null trailerKey, videoUrl, country, studio, director, tagline to undefined', () => {
    const result = mapContent(
      baseContent({
        trailerKey: null,
        videoUrl: null,
        country: null,
        studio: null,
        director: null,
        tagline: null,
      })
    )

    expect(result.trailerKey).toBeUndefined()
    expect(result.videoUrl).toBeUndefined()
    expect(result.country).toBeUndefined()
    expect(result.studio).toBeUndefined()
    expect(result.director).toBeUndefined()
    expect(result.tagline).toBeUndefined()
  })

  it('converts null runtime/seasons/episodes to undefined', () => {
    const result = mapContent(baseContent({ runtime: null, seasons: null, episodes: null }))
    expect(result.runtime).toBeUndefined()
    expect(result.seasons).toBeUndefined()
    expect(result.episodes).toBeUndefined()
  })

  it('preserves seasons/episodes for a tv show and casts mediaType correctly', () => {
    const result = mapContent(
      baseContent({ mediaType: 'tv', runtime: null, seasons: 3, episodes: 24 })
    )
    expect(result.mediaType).toBe('tv')
    expect(result.seasons).toBe(3)
    expect(result.episodes).toBe(24)
  })

  it('flattens the nested genre join structure into a flat array', () => {
    const result = mapContent(baseContent({ genres: [] }))
    expect(result.genres).toEqual([])
  })

  it('preserves the cast array as-is', () => {
    const result = mapContent(baseContent({ cast: ['Solo Actor'] }))
    expect(result.cast).toEqual(['Solo Actor'])
  })
})
