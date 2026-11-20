/** Postgres error code from a driver or Drizzle-wrapped error (postgres-js, PGlite), if any. */
export function pgErrorCode(e: unknown): string | undefined {
  let cur: unknown = e
  for (let i = 0; i < 4 && cur && typeof cur === 'object'; i++) {
    const code = (cur as { code?: unknown }).code
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code
    cur = (cur as { cause?: unknown }).cause
  }
  return undefined
}

export const isUniqueViolation = (e: unknown) => pgErrorCode(e) === '23505'
export const isForeignKeyViolation = (e: unknown) => pgErrorCode(e) === '23503'
