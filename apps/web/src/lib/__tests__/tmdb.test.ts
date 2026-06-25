import { describe, it, expect } from 'vitest'
import { imageUrl, getTrailerKey } from '@/lib/tmdb'

describe('imageUrl', () => {
  it('returns a placeholder when path is null', () => {
    expect(imageUrl(null)).toBe('/placeholder.jpg')
  })

  it('builds a TMDB CDN url with the default w500 size', () => {
    expect(imageUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg')
  })

  it('builds a TMDB CDN url with a custom size', () => {
    expect(imageUrl('/abc123.jpg', 'original')).toBe(
      'https://image.tmdb.org/t/p/original/abc123.jpg'
    )
  })
})

describe('getTrailerKey', () => {
  it('returns null when there are no videos', () => {
    expect(getTrailerKey([])).toBeNull()
  })

  it('ignores non-trailer and non-YouTube videos', () => {
    const videos = [
      { type: 'Teaser', site: 'YouTube', key: 'teaser1', official: true },
      { type: 'Trailer', site: 'Vimeo', key: 'vimeo1', official: true },
    ]
    expect(getTrailerKey(videos)).toBeNull()
  })

  it('prefers the official trailer over unofficial ones', () => {
    const videos = [
      { type: 'Trailer', site: 'YouTube', key: 'unofficial', official: false },
      { type: 'Trailer', site: 'Trailer', key: 'official', official: true },
    ]
    // second one has wrong site, only first qualifies along with a real official entry below
    const withOfficial = [
      { type: 'Trailer', site: 'YouTube', key: 'unofficial', official: false },
      { type: 'Trailer', site: 'YouTube', key: 'official', official: true },
    ]
    expect(getTrailerKey(withOfficial)).toBe('official')
  })

  it('falls back to the first YouTube trailer when none are official', () => {
    const videos = [
      { type: 'Trailer', site: 'YouTube', key: 'first', official: false },
      { type: 'Trailer', site: 'YouTube', key: 'second', official: false },
    ]
    expect(getTrailerKey(videos)).toBe('first')
  })
})
