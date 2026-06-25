import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SignJWT } from 'jose'
const prismaMock = vi.hoisted(() => ({
  profile: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
})) as any
vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { profilesRouter } from './profiles'
import { errorHandler } from '../middleware/errorHandler'

const SECRET = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'] ?? 'fallback-secret')

async function tokenFor(userId: string) {
  return new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(SECRET)
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/profiles', profilesRouter)
  app.use(errorHandler)
  return app
}

describe('Profiles routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET / requires authentication', async () => {
    const app = buildApp()
    const res = await request(app).get('/profiles')
    expect(res.status).toBe(401)
  })

  it('GET / scopes results to the authenticated user', async () => {
    prismaMock.profile.findMany.mockResolvedValue([{ id: 'p1', userId: 'user-1' }])
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app).get('/profiles').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(prismaMock.profile.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
  })

  it('POST / rejects creating a 6th profile (max 5)', async () => {
    prismaMock.profile.count.mockResolvedValue(5)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .post('/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Profile', avatarUrl: 'a.png' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/maximum 5 profiles/i)
    expect(prismaMock.profile.create).not.toHaveBeenCalled()
  })

  it('POST / creates a profile when under the limit, defaulting isKid to false', async () => {
    prismaMock.profile.count.mockResolvedValue(2)
    prismaMock.profile.create.mockResolvedValue({ id: 'p3', name: 'Kid', userId: 'user-1', isKid: false })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .post('/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Kid', avatarUrl: 'a.png' })

    expect(res.status).toBe(201)
    expect(prismaMock.profile.create).toHaveBeenCalledWith({
      data: { name: 'Kid', avatarUrl: 'a.png', isKid: false, userId: 'user-1' },
    })
  })

  it('PUT /:profileId returns 404 when the profile is not owned by the user', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .put('/profiles/someone-elses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked' })

    expect(res.status).toBe(404)
    expect(prismaMock.profile.update).not.toHaveBeenCalled()
  })

  it('PUT /:profileId only updates fields that were provided', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1', name: 'Old' })
    prismaMock.profile.update.mockResolvedValue({ id: 'p1', name: 'New Name' })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app)
      .put('/profiles/p1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' })

    expect(res.status).toBe(200)
    expect(prismaMock.profile.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { name: 'New Name' },
    })
  })

  it('PUT /:profileId can set isKid to false explicitly (falsy but defined)', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' })
    prismaMock.profile.update.mockResolvedValue({ id: 'p1', isKid: false })
    const token = await tokenFor('user-1')
    const app = buildApp()

    await request(app)
      .put('/profiles/p1')
      .set('Authorization', `Bearer ${token}`)
      .send({ isKid: false })

    expect(prismaMock.profile.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isKid: false },
    })
  })

  it('DELETE /:profileId returns 404 for a profile not owned by the user', async () => {
    prismaMock.profile.findFirst.mockResolvedValue(null)
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app).delete('/profiles/not-mine').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(prismaMock.profile.delete).not.toHaveBeenCalled()
  })

  it('DELETE /:profileId deletes an owned profile', async () => {
    prismaMock.profile.findFirst.mockResolvedValue({ id: 'p1', userId: 'user-1' })
    const token = await tokenFor('user-1')
    const app = buildApp()

    const res = await request(app).delete('/profiles/p1').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(prismaMock.profile.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })
})
