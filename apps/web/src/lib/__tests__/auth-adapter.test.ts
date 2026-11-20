// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestDb, type TestDb } from '@netflix/db/testing'

const holder = vi.hoisted(() => ({ db: undefined as unknown }))
vi.mock('@netflix/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@netflix/db')>()
  const { PgDatabase } = await import('drizzle-orm/pg-core')
  return {
    ...actual,
    db: new Proxy(Object.create(PgDatabase.prototype), {
      get: (_t, p) => Reflect.get(holder.db as object, p),
    }),
  }
})

import { authAdapter } from '../auth-adapter'

let testDb: TestDb
beforeAll(async () => {
  testDb = await createTestDb()
  holder.db = testDb.db
})
afterAll(() => testDb.close())
beforeEach(() => testDb.reset())

describe('Auth.js Drizzle adapter on our schema', () => {
  it('creates users, links accounts, sessions and verification tokens', async () => {
    const a = authAdapter
    const u = await a.createUser!({
      id: 'x',
      email: 'a@test.dev',
      name: 'A',
      emailVerified: null,
      image: null,
    })
    expect(u.id).toBeTruthy()
    expect((await a.getUserByEmail!('a@test.dev'))?.id).toBe(u.id)

    await a.linkAccount!({
      userId: u.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: 'gh-1',
    } as never)
    expect((await a.getUserByAccount!({ provider: 'github', providerAccountId: 'gh-1' }))?.id).toBe(
      u.id
    )

    const s = await a.createSession!({
      sessionToken: 'tok',
      userId: u.id,
      expires: new Date(Date.now() + 60_000),
    })
    expect((await a.getSessionAndUser!(s.sessionToken))?.user.id).toBe(u.id)

    await a.createVerificationToken!({
      identifier: 'a@test.dev',
      token: 't',
      expires: new Date(Date.now() + 60_000),
    })
    expect(await a.useVerificationToken!({ identifier: 'a@test.dev', token: 't' })).toBeTruthy()
    expect(await a.useVerificationToken!({ identifier: 'a@test.dev', token: 't' })).toBeNull()

    await a.deleteUser!(u.id)
    expect(await a.getUser!(u.id)).toBeNull()
  })
})
