import { afterEach, describe, expect, it, vi } from 'vitest'

const base = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://x:y@localhost:5432/z',
  NEXTAUTH_SECRET: 'a'.repeat(32),
}

async function load(env: Record<string, string | undefined>) {
  vi.resetModules()
  const saved = { ...process.env }
  for (const k of ['DATABASE_URL', 'NEXTAUTH_SECRET', 'PORT', 'RUN_MIGRATIONS', 'CORS_ORIGINS']) delete process.env[k]
  for (const [k, v] of Object.entries(env)) if (v !== undefined) process.env[k] = v
  try {
    const mod = await import('./env')
    return mod
  } finally {
    // keep env for the call under test; restored in afterEach
    void saved
  }
}

const original = { ...process.env }
afterEach(() => {
  for (const k of Object.keys(process.env)) if (!(k in original)) delete process.env[k]
  Object.assign(process.env, original)
})

describe('getEnv fail-fast (NFR-SEC-3, gap G1)', () => {
  it('parses a valid environment with defaults', async () => {
    const { getEnv } = await load(base)
    const env = getEnv()
    expect(env.PORT).toBe(4000)
    expect(env.RUN_MIGRATIONS).toBe(false)
    expect(env.ACCESS_TOKEN_TTL).toBe('15m')
  })

  it.each(['DATABASE_URL', 'NEXTAUTH_SECRET'])('throws when %s is missing', async (key) => {
    const { getEnv } = await load({ ...base, [key]: undefined })
    expect(() => getEnv()).toThrow(new RegExp(`Invalid environment.*${key}`))
  })

  it('rejects a short NEXTAUTH_SECRET (no fallback secret)', async () => {
    const { getEnv } = await load({ ...base, NEXTAUTH_SECRET: 'short' })
    expect(() => getEnv()).toThrow(/at least 32/)
  })

  it('parses RUN_MIGRATIONS and CORS origins', async () => {
    const { getEnv, getCorsOrigins } = await load({
      ...base,
      RUN_MIGRATIONS: 'true',
      CORS_ORIGINS: 'https://a.example, https://b.example ,',
    })
    expect(getEnv().RUN_MIGRATIONS).toBe(true)
    expect(getCorsOrigins()).toEqual(['https://a.example', 'https://b.example'])
  })
})
