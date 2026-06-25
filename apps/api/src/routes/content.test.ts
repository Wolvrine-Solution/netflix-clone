import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
const prismaMock = vi.hoisted(() => ({
  content: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
})) as any
vi.mock('@netflix/db', () => ({ prisma: prismaMock }))
vi.mock('../services/tmdbService', () => ({ getContentFromDB: vi.fn() }))

import { contentRouter } from './content'
import { errorHandler } from '../middleware/errorHandler'
import { getContentFromDB } from '../services/tmdbService'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/content', contentRouter)
  app.use(errorHandler)
  return app
}

describe('Content routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET / defaults to page 1, limit 20 when no query params given', async () => {
    prismaMock.content.findMany.mockResolvedValue([])
    prismaMock.content.count.mockResolvedValue(0)
    const app = buildApp()

    const res = await request(app).get('/content')

    expect(res.status).toBe(200)
    expect(res.body.page).toBe(1)
    expect(prismaMock.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 })
    )
  })

  it('GET / computes skip correctly for page 3, limit 10', async () => {
    prismaMock.content.findMany.mockResolvedValue([]);
    prismaMock.content.count.mockResolvedValue(45)
    const app = buildApp()

    const res = await request(app).get('/content?page=3&limit=10')

    expect(res.status).toBe(200)
    expect(prismaMock.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
    expect(res.body.totalPages).toBe(5)
    expect(res.body.totalResults).toBe(45)
  })

  it('GET / filters by mediaType when provided', async () => {
    prismaMock.content.findMany.mockResolvedValue([])
    prismaMock.content.count.mockResolvedValue(0)
    const app = buildApp()

    await request(app).get('/content?mediaType=tv')

    expect(prismaMock.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { mediaType: 'tv' } })
    )
  })

  it('GET / filters by genre using a case-insensitive contains match', async () => {
    prismaMock.content.findMany.mockResolvedValue([])
    prismaMock.content.count.mockResolvedValue(0)
    const app = buildApp()

    await request(app).get('/content?genre=comedy')

    expect(prismaMock.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { genres: { some: { genre: { name: { contains: 'comedy', mode: 'insensitive' } } } } },
      })
    )
  })

  it('GET /featured returns the single featured item', async () => {
    prismaMock.content.findFirst.mockResolvedValue({ id: 'c1', isFeatured: true })
    const app = buildApp()

    const res = await request(app).get('/content/featured')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ id: 'c1', isFeatured: true })
    expect(prismaMock.content.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isFeatured: true } })
    )
  })

  it('GET /:id returns 404 when content does not exist', async () => {
    vi.mocked(getContentFromDB).mockResolvedValue(null as any)
    const app = buildApp()

    const res = await request(app).get('/content/missing-id')

    expect(res.status).toBe(404)
  })

  it('GET /:id returns the content when found', async () => {
    vi.mocked(getContentFromDB).mockResolvedValue({ id: 'c1', title: 'Found' } as any)
    const app = buildApp()

    const res = await request(app).get('/content/c1')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ id: 'c1', title: 'Found' })
  })
})
