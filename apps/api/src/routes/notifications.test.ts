import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SignJWT } from 'jose'
const prismaMock = vi.hoisted(() => ({
  notification: { findMany: vi.fn(), updateMany: vi.fn() },
})) as any
vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { notificationsRouter } from './notifications'
import { errorHandler } from '../middleware/errorHandler'

const SECRET = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'] ?? 'fallback-secret')

async function tokenFor(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/notifications', notificationsRouter)
  app.use(errorHandler)
  return app
}

describe('Notifications routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('all routes require authentication', async () => {
    const app = buildApp()
    const getRes = await request(app).get('/notifications')
    const patchRes = await request(app).patch('/notifications/n1/read')
    const postRes = await request(app).post('/notifications/read-all')

    expect(getRes.status).toBe(401)
    expect(patchRes.status).toBe(401)
    expect(postRes.status).toBe(401)
  })

  it('GET / scopes notifications to the authenticated user only', async () => {
    prismaMock.notification.findMany.mockResolvedValue([{ id: 'n1', userId: 'user-1' }])
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app).get('/notifications').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })

  it('PATCH /:id/read scopes the update to id AND the authenticated userId (prevents marking others notifications)', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 1 })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .patch('/notifications/n1/read')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'n1', userId: 'user-1' },
      data: { read: true },
    })
  })

  it('POST /read-all marks only the authenticated users unread notifications as read', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 3 })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .post('/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: { read: true },
    })
  })
})
