import { notification } from '@netflix/db'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../../../test/harness'
import { adminAuth } from '../admin.test-utils'

let t: TestApp
let token: string
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())
beforeEach(async () => {
  await t.reset()
  token = (await adminAuth(t)).token
})
const post = (body: unknown) =>
  t.request('POST', '/api/admin/notifications/broadcast', { token, body })

describe('POST /broadcast', () => {
  it('sends to every user by default (message or body accepted)', async () => {
    await t.seedUser()
    await t.seedUser()
    const res = await post({ title: 'Hi', body: 'hello all' })
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Notification sent to 3 users')
    const rows = await t.db.select().from(notification)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      title: 'Hi',
      message: 'hello all',
      type: 'GENERAL',
      read: false,
    })
  })

  it('targets only the given userIds and keeps type/link', async () => {
    const u = await t.seedUser()
    await t.seedUser()
    const res = await post({ title: 'T', message: 'm', type: 'PROMO', link: '/x', userIds: [u.id] })
    expect(res.body.message).toBe('Notification sent to 1 users')
    const rows = await t.db.select().from(notification)
    expect(rows).toEqual([expect.objectContaining({ userId: u.id, type: 'PROMO', link: '/x' })])
  })

  it('validates: needs title and message/body, known type', async () => {
    expect((await post({ title: 'x' })).status).toBe(400)
    expect((await post({ message: 'x' })).status).toBe(400)
    expect((await post({ title: 'x', message: 'y', type: 'NOPE' })).status).toBe(400)
  })
})
