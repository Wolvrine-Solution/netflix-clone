import { PgDatabase } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { join } from 'node:path'
import type { PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from './schema'
import * as relations from './relations'

export const fullSchema = { ...schema, ...relations }

function connect() {
  const url = process.env['DATABASE_URL']
  if (!url) throw new Error('DATABASE_URL is required')
  const client = postgres(url, {
    max: Number(process.env['DB_POOL_MAX'] ?? 10),
    // PgBouncer transaction mode compatible: no server-side prepared statements.
    prepare: false,
    onnotice: () => undefined,
  })
  return { client, db: drizzle(client, { schema: fullSchema }) }
}

/** Driver-agnostic handle: postgres-js in production, PGlite in tests. */
export type Database = PgDatabase<PgQueryResultHKT, typeof fullSchema>
export type Tx = Parameters<Parameters<Database['transaction']>[0]>[0]

type Conn = ReturnType<typeof connect>
const g = globalThis as unknown as { __nc_db?: Conn }

function conn(): Conn {
  g.__nc_db ??= connect()
  return g.__nc_db
}

/** Lazy singleton so importing the package never opens a connection (tests, builds). */
// Prototype is PgDatabase so `is(db, PgDatabase)` checks (e.g. Auth.js adapter) accept the proxy.
export const db = new Proxy(Object.create(PgDatabase.prototype) as Database, {
  get(_t, prop, recv) {
    return Reflect.get(conn().db, prop, recv)
  },
})

export async function pingDb(): Promise<void> {
  await conn().client`select 1`
}

export async function closeDb(): Promise<void> {
  if (g.__nc_db) {
    await g.__nc_db.client.end({ timeout: 5 })
    delete g.__nc_db
  }
}

/** Apply committed Drizzle migrations (the `drizzle/` folder) to DATABASE_URL. */
export async function runMigrations(
  migrationsFolder = join(__dirname, '..', 'drizzle')
): Promise<void> {
  await migrate(conn().db, { migrationsFolder })
}
