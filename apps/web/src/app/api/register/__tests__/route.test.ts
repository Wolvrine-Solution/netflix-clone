// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestDb, type TestDb } from '@netflix/db/testing'

const holder = vi.hoisted(() => ({ db: undefined as unknown }))
vi.mock('@netflix/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@netflix/db')>()
  return { ...actual, db: new Proxy({}, { get: (_t, p) => Reflect.get(holder.db as object, p) }) }
})

import { user } from '@netflix/db'
import { POST } from '../route'

let testDb: TestDb
beforeAll(async () => {
  testDb = await createTestDb()
  holder.db = testDb.db
})
afterAll(() => testDb.close())
beforeEach(() => testDb.reset())

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    })
  )
}

describe('POST /api/register (real Postgres engine)', () => {
  it('creates a user with a hashed password', async () => {
    const res = await post({ email: 'new@test.dev', password: 'password123', name: 'New' })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.email).toBe('new@test.dev')
    const rows = await testDb.db.select().from(user)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.hashedPassword).toMatch(/^\$2[aby]\$/)
    expect(rows[0]!.hashedPassword).not.toBe('password123')
  })

  it('rejects a duplicate email with 400', async () => {
    await post({ email: 'dup@test.dev', password: 'password123', name: 'A' })
    const res = await post({ email: 'dup@test.dev', password: 'password123', name: 'B' })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Email already in use')
    expect(await testDb.db.select().from(user)).toHaveLength(1)
  })

  it('rejects an invalid payload with 400', async () => {
    const res = await post({ email: 'not-an-email', password: 'short', name: '' })
    expect(res.status).toBe(400)
  })
})
