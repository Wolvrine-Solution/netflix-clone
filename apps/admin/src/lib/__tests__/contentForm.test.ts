import { describe, expect, it } from 'vitest'
import {
  buildContentUpdateBody,
  buildManualCreateBody,
  isManualContentValid,
  toggleGenreId,
  type ContentFormState,
} from '../contentForm'

function baseForm(overrides: Partial<ContentFormState> = {}): ContentFormState {
  return {
    title: 'Inception',
    description: 'A mind-bending heist.',
    mediaType: 'movie',
    status: 'PUBLISHED',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    releaseDate: '2010-07-16',
    rating: '8.8',
    runtime: '148',
    maturityRating: 'PG-13',
    trailerKey: 'abc123',
    videoUrl: 'https://example.com/video.m3u8',
    language: 'en',
    country: 'US',
    studio: 'Warner Bros',
    director: 'Christopher Nolan',
    tagline: 'Your mind is the scene of the crime.',
    cast: 'Leonardo DiCaprio, Joseph Gordon-Levitt',
    ...overrides,
  }
}

describe('buildContentUpdateBody', () => {
  it('parses rating to a float', () => {
    const body = buildContentUpdateBody(baseForm({ rating: '7.5' }), [])
    expect(body.rating).toBe(7.5)
  })

  it('parses runtime to an int when truthy', () => {
    const body = buildContentUpdateBody(baseForm({ runtime: '120' }), [])
    expect(body.runtime).toBe(120)
  })

  it('treats runtime of 0 as falsy and converts it to undefined (locks current quirky behavior)', () => {
    const body = buildContentUpdateBody(baseForm({ runtime: 0 }), [])
    expect(body.runtime).toBeUndefined()
  })

  it('treats an empty-string runtime as undefined', () => {
    const body = buildContentUpdateBody(baseForm({ runtime: '' }), [])
    expect(body.runtime).toBeUndefined()
  })

  it('splits cast on commas and trims whitespace', () => {
    const body = buildContentUpdateBody(
      baseForm({ cast: ' Tom Hardy ,  Elliot Page,Ken Watanabe' }),
      []
    )
    expect(body.cast).toEqual(['Tom Hardy', 'Elliot Page', 'Ken Watanabe'])
  })

  it('filters out empty cast entries caused by stray/double commas', () => {
    const body = buildContentUpdateBody(baseForm({ cast: 'Tom Hardy,,  ,Ken Watanabe,' }), [])
    expect(body.cast).toEqual(['Tom Hardy', 'Ken Watanabe'])
  })

  it('produces an empty cast array for an empty cast string', () => {
    const body = buildContentUpdateBody(baseForm({ cast: '' }), [])
    expect(body.cast).toEqual([])
  })

  it('produces an empty cast array for a whitespace/comma-only cast string', () => {
    const body = buildContentUpdateBody(baseForm({ cast: '   , , ,' }), [])
    expect(body.cast).toEqual([])
  })

  it('passes through the selected genre ids verbatim', () => {
    const body = buildContentUpdateBody(baseForm(), [1, 4, 9])
    expect(body.genreIds).toEqual([1, 4, 9])
  })

  it('produces NaN rating for non-numeric rating input (locks current unvalidated behavior)', () => {
    const body = buildContentUpdateBody(baseForm({ rating: 'not-a-number' }), [])
    expect(Number.isNaN(body.rating)).toBe(true)
  })

  it('parses a partial numeric runtime string the same way parseInt would', () => {
    const body = buildContentUpdateBody(baseForm({ runtime: '90 minutes' }), [])
    expect(body.runtime).toBe(90)
  })
})

describe('isManualContentValid', () => {
  it('is valid when both title and description are present', () => {
    expect(isManualContentValid({ title: 'Title', description: 'Desc' })).toBe(true)
  })

  it('is invalid when title is empty', () => {
    expect(isManualContentValid({ title: '', description: 'Desc' })).toBe(false)
  })

  it('is invalid when description is empty', () => {
    expect(isManualContentValid({ title: 'Title', description: '' })).toBe(false)
  })

  it('is invalid when both are empty', () => {
    expect(isManualContentValid({ title: '', description: '' })).toBe(false)
  })
})

describe('buildManualCreateBody', () => {
  it('parses the rating field to a float while preserving other fields', () => {
    const body = buildManualCreateBody({ title: 'New Movie', rating: '6.5' })
    expect(body).toEqual({ title: 'New Movie', rating: 6.5 })
  })

  it('produces NaN for an empty rating string', () => {
    const body = buildManualCreateBody({ title: 'New Movie', rating: '' })
    expect(Number.isNaN(body.rating)).toBe(true)
  })
})

describe('toggleGenreId', () => {
  it('adds a genre id that is not currently selected', () => {
    expect(toggleGenreId([1, 2], 3)).toEqual([1, 2, 3])
  })

  it('removes a genre id that is currently selected', () => {
    expect(toggleGenreId([1, 2, 3], 2)).toEqual([1, 3])
  })

  it('adds to an empty selection', () => {
    expect(toggleGenreId([], 5)).toEqual([5])
  })

  it('removing the only selected id results in an empty array', () => {
    expect(toggleGenreId([5], 5)).toEqual([])
  })

  it('does not mutate the input array', () => {
    const original = [1, 2]
    toggleGenreId(original, 3)
    expect(original).toEqual([1, 2])
  })
})
