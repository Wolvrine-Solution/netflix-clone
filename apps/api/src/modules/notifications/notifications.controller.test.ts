import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

import { eq, notification } from '@netflix/db'

async function seedNotifs(userId: string, n: number, read = false) {
  for (let i = 0; i < n; i++)
    await t.db.insert(notification).values({ userId, title: `T${i}`, message: 'm', read })
}

describe('notifications routes', () => {
  it('all routes require authentication', async () => {
    expect((await t.request('GET', '/api/notifications')).status).toBe(401)
    expect((await t.request('PATCH', '/api/notifications/x/read')).status).toBe(401)
    expect((await t.request('POST', '/api/notifications/read-all')).status).toBe(401)
  })

  it('GET / scopes to the user, newest first, capped at 30', async () => {
    const a = await t.seedUser()
    const b = await t.seedUser()
    await t.db.insert(notification).values([
      { userId: a.id, title: 'old', message: 'm', createdAt: new Date('2024-01-01') },
      { userId: a.id, title: 'new', message: 'm', createdAt: new Date('2024-06-01') },
      { userId: b.id, title: 'other', message: 'm' },
    ])
    const res = await t.request('GET', '/api/v1/notifications', { token: await t.token(a.id) })
    expect(res.status).toBe(200)
    expect(res.body.data.map((n: { title: string }) => n.title)).toEqual(['new', 'old'])

    await seedNotifs(b.id, 35)
    const many = await t.request('GET', '/api/notifications', { token: await t.token(b.id) })
    expect(many.body.data).toHaveLength(30)
  })

  it("PATCH /:id/read marks only the caller's notification (cannot touch others')", async () => {
    const a = await t.seedUser()
    const b = await t.seedUser()
    const [mine] = await t.db
      .insert(notification)
      .values({ userId: a.id, title: 'a', message: 'm' })
      .returning()
    const [theirs] = await t.db
      .insert(notification)
      .values({ userId: b.id, title: 'b', message: 'm' })
      .returning()
    const token = await t.token(a.id)

    const ok = await t.request('PATCH', `/api/notifications/${mine!.id}/read`, { token })
    expect(ok.status).toBe(200)
    expect(ok.body.message).toBe('Marked as read')
    const hack = await t.request('PATCH', `/api/notifications/${theirs!.id}/read`, { token })
    expect(hack.status).toBe(200)

    const [m] = await t.db.select().from(notification).where(eq(notification.id, mine!.id))
    const [o] = await t.db.select().from(notification).where(eq(notification.id, theirs!.id))
    expect(m!.read).toBe(true)
    expect(o!.read).toBe(false)
  })

  it("POST /read-all marks only the caller's unread notifications (status 200)", async () => {
    const a = await t.seedUser()
    const b = await t.seedUser()
    await seedNotifs(a.id, 3)
    await seedNotifs(b.id, 2)
    const res = await t.request('POST', '/api/notifications/read-all', {
      token: await t.token(a.id),
    })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('All notifications marked as read')
    const rows = await t.db.select().from(notification)
    expect(rows.filter((r) => r.userId === a.id).every((r) => r.read)).toBe(true)
    expect(rows.filter((r) => r.userId === b.id).every((r) => !r.read)).toBe(true)
  })
})
