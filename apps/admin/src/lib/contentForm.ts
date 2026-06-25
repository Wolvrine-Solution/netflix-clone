/**
 * Pure helpers extracted from ContentEditForm / NewContentPage so the
 * data-shaping logic that runs before a save/create request can be
 * unit tested without rendering React components.
 */

export interface ContentFormState {
  title: string
  description: string
  mediaType: string
  status: string
  posterPath: string
  backdropPath: string
  releaseDate: string
  rating: number | string
  runtime?: number | string
  maturityRating: string
  trailerKey?: string
  videoUrl?: string
  language: string
  country?: string
  studio?: string
  director?: string
  tagline?: string
  cast: string
}

export interface ContentUpdateBody {
  title: string
  description: string
  mediaType: string
  status: string
  posterPath: string
  backdropPath: string
  releaseDate: string
  rating: number
  runtime: number | undefined
  maturityRating: string
  trailerKey?: string
  videoUrl?: string
  language: string
  country?: string
  studio?: string
  director?: string
  tagline?: string
  cast: string[]
  genreIds: number[]
}

/**
 * Mirrors the `save()` body construction in ContentEditForm.tsx exactly:
 * - rating is parsed with parseFloat (NaN passes through untouched, matching current behavior)
 * - runtime uses a falsy check, so 0/'' both become undefined
 * - cast is split on commas, trimmed, and empty entries are filtered out
 */
export function buildContentUpdateBody(
  form: ContentFormState,
  selectedGenreIds: number[]
): ContentUpdateBody {
  return {
    ...form,
    rating: parseFloat(String(form.rating)),
    runtime: form.runtime ? parseInt(String(form.runtime), 10) : undefined,
    cast: form.cast.split(',').map((c) => c.trim()).filter(Boolean),
    genreIds: selectedGenreIds,
  }
}

/**
 * Mirrors the manual-create "Create Content" button's disabled condition
 * in content/new/page.tsx: `disabled={!manual.title || !manual.description}`.
 */
export function isManualContentValid(manual: { title: string; description: string }): boolean {
  return Boolean(manual.title) && Boolean(manual.description)
}

/**
 * Mirrors the manual-create body construction in content/new/page.tsx's
 * createManual(): spreads the form and parses rating with parseFloat.
 */
export function buildManualCreateBody<T extends { rating: string }>(
  manual: T
): Omit<T, 'rating'> & { rating: number } {
  return { ...manual, rating: parseFloat(manual.rating) }
}

/**
 * Mirrors the genre toggle logic in ContentEditForm.tsx:
 * onClick={() => setSelectedGenreIds((ids) => active ? ids.filter((i) => i !== g.id) : [...ids, g.id])}
 */
export function toggleGenreId(selectedGenreIds: number[], genreId: number): number[] {
  const active = selectedGenreIds.includes(genreId)
  return active ? selectedGenreIds.filter((i) => i !== genreId) : [...selectedGenreIds, genreId]
}
