/**
 * Needs a real Postgres server (migrator and baseline use the postgres-js driver):
 *   TEST_DATABASE_URL=postgresql://postgres:password@localhost:55432/postgres bun run test
 * Each test creates and drops its own database. Skipped (loudly) when the variable is unset.
 */
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const admin = process.env['TEST_DATABASE_URL']
const root = join(__dirname, '..')
const withDb = (name: string) => admin!.replace(/\/[^/]*$/, `/${name}`)
const run = (script: string, url: string) =>
  execFileSync('bun', [join(root, 'src', script)], {
    env: { ...process.env, DATABASE_URL: url },
    encoding: 'utf8',
    stdio: 'pipe',
  })

describe.skipIf(!admin)('migrations and baseline against real Postgres', () => {
  let sql: postgres.Sql
  const dbs: string[] = []
  beforeAll(() => {
    sql = postgres(admin!, { max: 1, onnotice: () => undefined })
  })
  afterAll(async () => {
    for (const d of dbs) await sql.unsafe(`drop database if exists "${d}" with (force)`)
    await sql.end()
  })
  const fresh = async (name: string) => {
    const n = `${name}_${Date.now()}`
    dbs.push(n)
    await sql.unsafe(`create database "${n}"`)
    return withDb(n)
  }
  const tableCount = async (url: string) => {
    const c = postgres(url, { max: 1 })
    const [r] = await c`select count(*)::int n from information_schema.tables where table_schema='public'`
    await c.end()
    return r!['n'] as number
  }

  it('migrates an empty database and a second run is a no-op', async () => {
    const url = await fresh('mig')
    run('migrate.ts', url)
    expect(await tableCount(url)).toBe(38)
    run('migrate.ts', url)
    expect(await tableCount(url)).toBe(38)
  })

  it('baseline marks an existing database without executing SQL, then later migrations run', async () => {
    const url = await fresh('base')
    // Simulate a Prisma-created database: baseline tables exist, nullable arrays, no history.
    const baselineSql = (await import('node:fs')).readFileSync(
      join(root, 'drizzle', '0000_baseline.sql'),
      'utf8'
    )
    const c = postgres(url, { max: 1, onnotice: () => undefined })
    for (const stmt of baselineSql.split('--> statement-breakpoint')) await c.unsafe(stmt)
    await c.end()

    expect(run('baseline.ts', url)).toMatch(/baseline recorded/)
    expect(run('baseline.ts', url)).toMatch(/already present/)
    run('migrate.ts', url) // applies 0001 only; would fail on 0000 (tables exist)
    const c2 = postgres(url, { max: 1 })
    const rows = await c2`select count(*)::int n from drizzle."__drizzle_migrations"`
    await c2.end()
    expect(rows[0]!['n']).toBe(2)
  })

  it('baseline refuses an empty database', async () => {
    const url = await fresh('empty')
    expect(() => run('baseline.ts', url)).toThrow()
  })
})
