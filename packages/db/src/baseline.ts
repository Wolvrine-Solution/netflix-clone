/**
 * Adopt an existing database (created earlier by Prisma, same table names) into Drizzle:
 * records the baseline migration (0000) as applied WITHOUT executing it. Later migrations run
 * normally with `db:migrate`. Refuses to act when the baseline looks already recorded.
 */
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { join } from 'node:path'
import postgres from 'postgres'

const url = process.env['DATABASE_URL']
if (!url) throw new Error('DATABASE_URL is required')

const [baseline] = readMigrationFiles({
  migrationsFolder: join(import.meta.dirname, '..', 'drizzle'),
})
if (!baseline) throw new Error('no migrations found in packages/db/drizzle')

const sql = postgres(url, { max: 1, onnotice: () => undefined })
try {
  const [{ exists } = { exists: false }] = await sql<{ exists: boolean }[]>`
    select to_regclass('"User"') is not null as exists`
  if (!exists)
    throw new Error('No "User" table found: this database is empty. Run db:migrate instead.')

  await sql`create schema if not exists drizzle`
  await sql`create table if not exists drizzle."__drizzle_migrations" (
    id serial primary key, hash text not null, created_at bigint)`
  const [{ n } = { n: 0 }] = await sql<{ n: number }[]>`
    select count(*)::int as n from drizzle."__drizzle_migrations"`
  if (n > 0) {
    console.log('migration history already present; nothing to do')
  } else {
    await sql`insert into drizzle."__drizzle_migrations" (hash, created_at)
      values (${baseline.hash}, ${baseline.folderMillis})`
    console.log('baseline recorded as applied')
  }
} finally {
  await sql.end({ timeout: 5 })
}
