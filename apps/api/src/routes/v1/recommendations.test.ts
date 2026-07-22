import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SignJWT } from 'jose'

const prismaMock = vi.hoisted(() => ({
  profile: { findFirst: vi.fn() },
})) as any

const getRecommendationsMock = vi.hoisted(() => vi.fn())

vi.mock('@netflix/db', () => ({ prisma: prismaMock }))
vi.mock('../../modules/recommendations/service', () => ({
  getRecommendations: getRecommendationsMock,
}))

import { recommendationsRouter } from './recommendations'
import { errorHandler } from '../../middleware/errorHandler'

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
  app.use('/recommendations', recommendationsRouter)
  app.use(errorHandler)
  return app
}

describe('Recommendations routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /:profileId requires authentication', async () => {
    const app = buildApp()
    const res = await request(app).get('/recommendations/p1')
    expect(res.status).toBe(401)
  })

  it('GET /:profileId returns 403 when the profile belongs to another user', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .get('/recommendations/other-profile')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(prismaMock.profile.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-profile', userId: 'user-1' },
    })
    expect(getRecommendationsMock).not.toHaveBeenCalled()
  })

  it('GET /:profileId returns recommendations for an owned profile', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' })
    getRecommendationsMock.mockResolvedValue([{ id: 'c1', title: 'Movie' }])
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .get('/recommendations/p1')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(getRecommendationsMock).toHaveBeenCalledWith('p1')
    expect(res.body.data).toEqual([{ id: 'c1', title: 'Movie' }])
  })
})
