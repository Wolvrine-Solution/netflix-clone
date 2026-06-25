import { describe, it, expect } from 'vitest'
import { cn, formatRuntime, formatRating, getReleaseYear, truncate } from '@/lib/utils'

describe('cn', () => {
  it('merges class names and dedupes conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('drops falsy values', () => {
    expect(cn('text-white', false && 'hidden', null, undefined, 'font-bold')).toBe(
      'text-white font-bold'
    )
  })
})

describe('formatRuntime', () => {
  it('formats minutes under an hour as just minutes', () => {
    expect(formatRuntime(45)).toBe('45m')
  })

  it('formats exact hours without a minutes remainder', () => {
    expect(formatRuntime(120)).toBe('2h 0m')
  })

  it('formats hours and minutes', () => {
    expect(formatRuntime(125)).toBe('2h 5m')
  })

  it('formats zero minutes', () => {
    expect(formatRuntime(0)).toBe('0m')
  })
})

describe('formatRating', () => {
  it('converts a 0-10 rating into a rounded percentage match string', () => {
    expect(formatRating(8.5)).toBe('85% Match')
  })

  it('rounds to the nearest percent', () => {
    expect(formatRating(7.66)).toBe('77% Match')
  })

  it('handles a zero rating', () => {
    expect(formatRating(0)).toBe('0% Match')
  })
})

describe('getReleaseYear', () => {
  it('extracts the year from an ISO date string', () => {
    expect(getReleaseYear('1999-03-31')).toBe('1999')
  })

  it('returns an empty string for an empty/falsy date', () => {
    expect(getReleaseYear('')).toBe('')
  })
})

describe('truncate', () => {
  it('returns the original string when within the max length', () => {
    expect(truncate('Stranger Things', 50)).toBe('Stranger Things')
  })

  it('truncates and appends an ellipsis when over the max length', () => {
    expect(truncate('Stranger Things', 9)).toBe('Stranger...')
  })

  it('trims trailing whitespace before appending the ellipsis', () => {
    expect(truncate('Strange  Things', 8)).toBe('Strange...')
  })

  it('handles a string exactly at the max length boundary', () => {
    expect(truncate('Dark', 4)).toBe('Dark')
  })
})
