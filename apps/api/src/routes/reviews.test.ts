import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SignJWT } from 'jose'

const prismaMock = vi.hoisted(() => ({
  profile: { findFirst: vi.fn() },
  review: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
})) as any

vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { reviewsRouter } from './reviews'
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
  app.use('/reviews', reviewsRouter)
  app.use(errorHandler)
  return app
}

const VALID_PROFILE_ID = 'clhzzzzzzzzzzzzzzzzzzzzzz'

describe('Reviews routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /:contentId returns 403 when profileId belongs to another user', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .post('/reviews/content-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileId: VALID_PROFILE_ID, rating: 8 })

    expect(res.status).toBe(403)
    expect(prismaMock.review.upsert).not.toHaveBeenCalled()
  })

  it('POST /:contentId upserts a review for an owned profile', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' })
    prismaMock.review.upsert.mockResolvedValue({ id: 'r1', rating: 8 })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .post('/reviews/content-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ profileId: VALID_PROFILE_ID, rating: 8 })

    expect(res.status).toBe(201)
    expect(prismaMock.review.upsert).toHaveBeenCalled()
  })

  it('DELETE /:contentId returns 403 when profileId belongs to another user', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .delete('/reviews/content-1?profileId=other-profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(prismaMock.review.deleteMany).not.toHaveBeenCalled()
  })
})
