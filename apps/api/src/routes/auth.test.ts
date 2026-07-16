import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import * as bcrypt from 'bcryptjs'
const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  refreshToken: { create: vi.fn().mockResolvedValue({ id: 'rt1' }) },
})) as any
vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { authRouter } from './auth'
import { errorHandler } from '../middleware/errorHandler'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/auth', authRouter)
  app.use(errorHandler)
  return app
}

describe('POST /auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when email is missing', async () => {
    const app = buildApp()
    const res = await request(app).post('/auth/signin').send({ password: 'secret' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/required/i)
  })

  it('returns 400 when password is missing', async () => {
    const app = buildApp()
    const res = await request(app).post('/auth/signin').send({ email: 'a@b.com' })
    expect(res.status).toBe(400)
  })

  it('returns 401 when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const app = buildApp()
    const res = await request(app).post('/auth/signin').send({ email: 'nope@b.com', password: 'secret' })
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/invalid email or password/i)
  })

  it('returns 401 when the user has no hashedPassword (oauth-only account)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', hashedPassword: null })
    const app = buildApp()
    const res = await request(app).post('/auth/signin').send({ email: 'a@b.com', password: 'secret' })
    expect(res.status).toBe(401)
  })

  it('returns 401 when the password does not match', async () => {
    const hashed = await bcrypt.hash('correct-password', 10)
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', hashedPassword: hashed })
    const app = buildApp()
    const res = await request(app).post('/auth/signin').send({ email: 'a@b.com', password: 'wrong-password' })
    expect(res.status).toBe(401)
  })

  it('returns a token and sanitized user on valid credentials', async () => {
    const hashed = await bcrypt.hash('correct-password', 10)
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      hashedPassword: hashed,
      name: 'Alice',
      image: null,
    })
    const app = buildApp()
    const res = await request(app).post('/auth/signin').send({ email: 'a@b.com', password: 'correct-password' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTypeOf('string')
    expect(res.body.user).toEqual({ id: 'u1', name: 'Alice', email: 'a@b.com', image: null })
    expect(res.body.user.hashedPassword).toBeUndefined()
  })

  it('looks up the user by lowercased, trimmed email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const app = buildApp()
    await request(app).post('/auth/signin').send({ email: '  Alice@Example.COM  ', password: 'secret' })

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'alice@example.com' } })
  })
})
