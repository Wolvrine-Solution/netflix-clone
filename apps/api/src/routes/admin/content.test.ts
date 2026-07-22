import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SignJWT } from 'jose'
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  content: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  genre: { upsert: vi.fn() },
  adminLog: { create: vi.fn().mockResolvedValue({}) },
})) as any
vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { adminContentRouter } from './content'
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
  app.use('/admin/content', adminContentRouter)
  app.use(errorHandler)
  return app
}

const validContent = {
  title: 'New Movie',
  mediaType: 'movie',
  description: 'desc',
  posterPath: '/p.jpg',
  backdropPath: '/b.jpg',
  releaseDate: '2024-01-01',
  rating: 7.5,
}

describe('Admin content routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated requests with 401', async () => {
    const app = buildApp()
    const res = await request(app).get('/admin/content')
    expect(res.status).toBe(401)
  })

  it('rejects non-admin users with 403', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: 'USER', isSuspended: false })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app).get('/admin/content').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  describe('as an authenticated admin', () => {
    async function adminToken() {
      prismaMock.user.findUnique.mockResolvedValue({ role: 'ADMIN', isSuspended: false })
      return tokenFor('admin-1')
    }

    it('POST / rejects creation with a 400 when required fields are missing', async () => {
      const token = await adminToken()
      const app = buildApp()

      const res = await request(app)
        .post('/admin/content')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'No media type' })

      expect(res.status).toBe(400)
      expect(prismaMock.content.create).not.toHaveBeenCalled()
    })

    it('POST / rejects an out-of-range rating', async () => {
      const token = await adminToken()
      const app = buildApp()

      const res = await request(app)
        .post('/admin/content')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validContent, rating: 15 })

      expect(res.status).toBe(400)
    })

    it('POST / creates content and writes an admin audit log on success', async () => {
      const token = await adminToken()
      prismaMock.content.create.mockResolvedValue({
        id: 'c1',
        ...validContent,
        tmdbId: null,
        trailerKey: null,
        videoUrl: null,
        runtime: null,
        seasons: null,
        episodes: null,
        maturityRating: 'TV-MA',
        isFeatured: false,
        status: 'PUBLISHED',
        language: 'en',
        country: null,
        studio: null,
        director: null,
        tagline: null,
        cast: [],
        genres: [],
      })
      const app = buildApp()

      const res = await request(app)
        .post('/admin/content')
        .set('Authorization', `Bearer ${token}`)
        .send(validContent)

      expect(res.status).toBe(201)
      expect(prismaMock.adminLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            adminId: 'admin-1',
            action: 'CREATE',
            resource: 'Content',
          }),
        })
      )
    })

    it('POST /import returns the existing record (and skips TMDB fetch) when tmdbId is already imported', async () => {
      const token = await adminToken()
      prismaMock.content.findUnique.mockResolvedValue({
        id: 'c1',
        tmdbId: 999,
        title: 'Already Here',
        mediaType: 'movie',
        description: '',
        posterPath: '',
        backdropPath: '',
        releaseDate: '',
        rating: 5,
        maturityRating: 'TV-MA',
        isFeatured: false,
        status: 'PUBLISHED',
        language: 'en',
        cast: [],
        runtime: null,
        seasons: null,
        episodes: null,
        trailerKey: null,
        videoUrl: null,
        country: null,
        studio: null,
        director: null,
        tagline: null,
      })
      const fetchSpy = vi.spyOn(global, 'fetch')
      const app = buildApp()

      const res = await request(app)
        .post('/admin/content/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: 999, mediaType: 'movie' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Already imported')
      expect(fetchSpy).not.toHaveBeenCalled()
      fetchSpy.mockRestore()
    })

    it('POST /import rejects an invalid (non-positive) tmdbId', async () => {
      const token = await adminToken()
      const app = buildApp()

      const res = await request(app)
        .post('/admin/content/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ tmdbId: -5, mediaType: 'movie' })

      expect(res.status).toBe(400)
    })

    it('GET /:id returns 404 for nonexistent content', async () => {
      const token = await adminToken()
      prismaMock.content.findUnique.mockResolvedValue(null)
      const app = buildApp()

      const res = await request(app)
        .get('/admin/content/missing')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })

    it('PUT /:id returns 404 when updating content that does not exist', async () => {
      const token = await adminToken()
      prismaMock.content.findUnique.mockResolvedValue(null)
      const app = buildApp()

      const res = await request(app)
        .put('/admin/content/missing')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated' })

      expect(res.status).toBe(404)
      expect(prismaMock.content.update).not.toHaveBeenCalled()
    })

    it('DELETE /:id returns 404 when deleting content that does not exist', async () => {
      const token = await adminToken()
      prismaMock.content.findUnique.mockResolvedValue(null)
      const app = buildApp()

      const res = await request(app)
        .delete('/admin/content/missing')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
      expect(prismaMock.content.delete).not.toHaveBeenCalled()
    })

    it('PATCH /:id/featured unsets any previously featured content before setting the new one', async () => {
      const token = await adminToken()
      prismaMock.content.updateMany.mockResolvedValue({ count: 1 })
      prismaMock.content.update.mockResolvedValue({ id: 'c2', isFeatured: true })
      const app = buildApp()

      const res = await request(app)
        .patch('/admin/content/c2/featured')
        .set('Authorization', `Bearer ${token}`)
        .send({ isFeatured: true })

      expect(res.status).toBe(200)
      expect(prismaMock.content.updateMany).toHaveBeenCalledWith({
        where: { isFeatured: true },
        data: { isFeatured: false },
      })
      expect(prismaMock.content.update).toHaveBeenCalledWith({
        where: { id: 'c2' },
        data: { isFeatured: true },
      })
    })

    it('PATCH /:id/featured does not unset others when isFeatured is false', async () => {
      const token = await adminToken()
      prismaMock.content.update.mockResolvedValue({ id: 'c2', isFeatured: false })
      const app = buildApp()

      await request(app)
        .patch('/admin/content/c2/featured')
        .set('Authorization', `Bearer ${token}`)
        .send({ isFeatured: false })

      expect(prismaMock.content.updateMany).not.toHaveBeenCalled()
    })
  })
})
