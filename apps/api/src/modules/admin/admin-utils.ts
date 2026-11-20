import { AppError } from '../../common/app-error'

/** Postgres error code, whether thrown directly or wrapped in a DrizzleQueryError (.cause). */
export function pgErrorCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } } | null
  return e?.cause?.code ?? e?.code
}

export function intParam(value: unknown, fallback: number): number {
  const n = parseInt(String(value ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

export function pageParams(
  query: { page?: unknown; limit?: unknown },
  maxLimit: number
): { page: number; limit: number } {
  return {
    page: Math.max(1, intParam(query.page, 1)),
    limit: Math.min(maxLimit, Math.max(1, intParam(query.limit, 20))),
  }
}

export function notFound(what: string): never {
  throw new AppError(404, `${what} not found`)
}
