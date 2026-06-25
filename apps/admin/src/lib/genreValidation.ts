/**
 * Pure helpers extracted from genres/page.tsx so the validation that
 * gates add/edit submissions can be unit tested directly.
 */

/**
 * Mirrors the guard in addGenre()/saveEdit(): `if (!name.trim()) return`.
 * Returns the trimmed name when valid, or null when the name is empty/whitespace-only.
 */
export function normalizeGenreName(name: string): string | null {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Mirrors the "Add" button's disabled condition: `disabled={adding || !newName.trim()}`. */
export function isGenreNameValid(name: string): boolean {
  return name.trim().length > 0
}
