/**
 * In-process Postgres for tests (PGlite). Applies the real Drizzle migrations, so tests run
 * against the same schema production uses, with no Docker and no mocks of the query builder.
 */
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { join } from 'node:path'
import { fullSchema } from './client'
import type { Database } from './client'

export interface TestDb {
  db: Database
  /** Remove every row from every table (keeps schema). Call in beforeEach. */
  reset(): Promise<void>
  close(): Promise<void>
}

export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite()
  const db = drizzle(client, { schema: fullSchema })
  await migrate(db, { migrationsFolder: join(__dirname, '..', 'drizzle') })
  return {
    db: db as unknown as Database,
    async reset() {
      const res = await client.query<{ tablename: string }>(
        `select tablename from pg_tables where schemaname = 'public'`
      )
      const names = res.rows.map((r) => `"${r.tablename}"`).join(', ')
      if (names) await client.exec(`truncate table ${names} restart identity cascade`)
    },
    async close() {
      await client.close()
    },
  }
}
