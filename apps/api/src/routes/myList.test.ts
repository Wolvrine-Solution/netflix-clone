import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SignJWT } from 'jose'
const prismaMock = vi.hoisted(() => ({
  profile: { findFirst: vi.fn() },
  myListItem: { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
})) as any
vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { myListRouter } from './myList'
import { errorHandler } from '../middleware/errorHandler'

const SECRET = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'] ?? 'fallback-secret')

async function tokenFor(userId: string) {
  return new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(SECRET)
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/profiles', myListRouter)
  app.use(errorHandler)
  return app
}

describe('My List routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET requires authentication', async () => {
    const app = buildApp()
    const res = await request(app).get('/profiles/p1/my-list')
    expect(res.status).toBe(401)
  })

  it('GET returns 403 when the profile does not belong to the authenticated user', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app).get('/profiles/p1/my-list').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(prismaMock.profile.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', userId: 'user-1' } })
  })

  it('GET returns the mapped content list when the profile is owned by the user', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' })
    prismaMock.myListItem.findMany.mockResolvedValue([
      { content: { id: 'c1', title: 'Movie A' } },
      { content: { id: 'c2', title: 'Movie B' } },
    ])
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app).get('/profiles/p1/my-list').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([
      { id: 'c1', title: 'Movie A' },
      { id: 'c2', title: 'Movie B' },
    ])
  })

  it('POST returns 403 when adding to a profile the user does not own', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .post('/profiles/other-profile/my-list')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: 'c1' })

    expect(res.status).toBe(403)
    expect(prismaMock.myListItem.create).not.toHaveBeenCalled()
  })

  it('POST creates a my-list item for an owned profile', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' })
    prismaMock.myListItem.create.mockResolvedValue({ id: 'item-1', profileId: 'p1', contentId: 'c1' })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .post('/profiles/p1/my-list')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: 'c1' })

    expect(res.status).toBe(201)
    expect(prismaMock.myListItem.create).toHaveBeenCalledWith({ data: { profileId: 'p1', contentId: 'c1' } })
  })

  it('DELETE returns 403 for an unowned profile and does not delete', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .delete('/profiles/not-mine/my-list/c1')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(prismaMock.myListItem.deleteMany).not.toHaveBeenCalled()
  })

  it('DELETE removes the item scoped to profileId and contentId for an owned profile', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' })
    prismaMock.myListItem.deleteMany.mockResolvedValue({ count: 1 })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .delete('/profiles/p1/my-list/c1')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(prismaMock.myListItem.deleteMany).toHaveBeenCalledWith({ where: { profileId: 'p1', contentId: 'c1' } })
  })
})
