import { describe, expect, it } from 'vitest'
import { isGenreNameValid, normalizeGenreName } from '../genreValidation'

describe('normalizeGenreName', () => {
  it('returns the trimmed name for valid input', () => {
    expect(normalizeGenreName('  Action  ')).toBe('Action')
  })

  it('returns null for an empty string', () => {
    expect(normalizeGenreName('')).toBeNull()
  })

  it('returns null for a whitespace-only string', () => {
    expect(normalizeGenreName('   ')).toBeNull()
  })

  it('returns null for a tabs/newlines-only string', () => {
    expect(normalizeGenreName('\t\n  \n')).toBeNull()
  })

  it('preserves internal whitespace while trimming only the ends', () => {
    expect(normalizeGenreName('  Science Fiction  ')).toBe('Science Fiction')
  })
})

describe('isGenreNameValid', () => {
  it('is true for a non-empty trimmed name', () => {
    expect(isGenreNameValid('Comedy')).toBe(true)
  })

  it('is false for an empty string', () => {
    expect(isGenreNameValid('')).toBe(false)
  })

  it('is false for a whitespace-only string', () => {
    expect(isGenreNameValid('   ')).toBe(false)
  })
})
