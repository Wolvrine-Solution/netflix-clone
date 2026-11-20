import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, playbackSession, user } from '@netflix/db'
import { createTestDb, type TestDb } from '@netflix/db/testing'
import { seedSubscription } from '../playback/playback.fixtures'
import { SessionsService } from './sessions.service'

const store = new Map<string, string>()
const redis = {
  get: async (k: string) => store.get(k) ?? null,
  set: async (k: string, v: string) => (store.set(k, v), 'OK'),
  del: async () => 0,
  incr: async () => 0,
  expire: async () => 0,
  keys: async () => [],
}

let t: TestDb
let svc: SessionsService
beforeAll(async () => {
  t = await createTestDb()
  svc = new SessionsService(t.db, redis)
})
afterAll(() => t.close())
beforeEach(async () => {
  await t.reset()
  store.clear()
})

async function mkUser() {
  const [u] = await t.db
    .insert(user)
    .values({ email: `${Math.random()}@t.dev` })
    .returning()
  return u!
}
const rows = (userId: string) =>
  t.db.select().from(playbackSession).where(eq(playbackSession.userId, userId))

describe('register', () => {
  it('creates a session and mirrors it to redis', async () => {
    const u = await mkUser()
    const id = await svc.register(u.id, undefined, 'tv', '1080p')
    const [row] = await rows(u.id)
    expect(row).toMatchObject({ id, deviceId: 'tv', qualityCap: '1080p' })
    expect(store.get(`session:${id}`)).toBe(u.id)
  })

  it('BASIC (and users with no subscription) evict the oldest stream beyond 1', async () => {
    const u = await mkUser()
    const first = await svc.register(u.id, undefined, 'a')
    const second = await svc.register(u.id, undefined, 'b')
    const left = await rows(u.id)
    expect(left.map((r) => r.id)).toEqual([second])
    expect(left.map((r) => r.id)).not.toContain(first)
  })

  it('STANDARD allows 2 concurrent streams and evicts the least recently active on the 3rd', async () => {
    const u = await mkUser()
    await seedSubscription(t.db, u.id, 'STANDARD')
    const a = await svc.register(u.id, undefined, 'a')
    const b = await svc.register(u.id, undefined, 'b')
    expect(await rows(u.id)).toHaveLength(2)
    await svc.heartbeat(a, u.id) // a becomes more recent than b
    const c = await svc.register(u.id, undefined, 'c')
    const ids = (await rows(u.id)).map((r) => r.id).sort()
    expect(ids).toEqual([a, c].sort())
    expect(ids).not.toContain(b)
  })

  it('purges expired sessions and does not count them against the limit', async () => {
    const u = await mkUser()
    await t.db
      .insert(playbackSession)
      .values({ userId: u.id, deviceId: 'old', expiresAt: new Date(Date.now() - 1000) })
    await svc.register(u.id, undefined, 'new')
    expect((await rows(u.id)).map((r) => r.deviceId)).toEqual(['new'])
  })

  it('does not touch other users', async () => {
    const [a, b] = [await mkUser(), await mkUser()]
    await svc.register(a.id, undefined, 'a')
    await svc.register(b.id, undefined, 'b')
    expect(await rows(a.id)).toHaveLength(1)
    expect(await rows(b.id)).toHaveLength(1)
  })
})

describe('heartbeat', () => {
  it('extends expiry for the owner', async () => {
    const u = await mkUser()
    const id = await svc.register(u.id, undefined, 'a')
    await t.db
      .update(playbackSession)
      .set({ expiresAt: new Date(Date.now() + 1000) })
      .where(eq(playbackSession.id, id))
    expect(await svc.heartbeat(id, u.id)).toBe(true)
    const [row] = await rows(u.id)
    expect(row!.expiresAt.getTime()).toBeGreaterThan(Date.now() + 60_000)
  })

  it('returns false for unknown sessions and for another user', async () => {
    const [a, b] = [await mkUser(), await mkUser()]
    const id = await svc.register(a.id, undefined, 'a')
    expect(await svc.heartbeat('missing', a.id)).toBe(false)
    expect(await svc.heartbeat(id, b.id)).toBe(false)
  })
})
