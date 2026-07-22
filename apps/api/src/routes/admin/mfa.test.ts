import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import { SignJWT } from 'jose'
import { authenticator } from 'otplib'

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
})) as any

vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { adminMfaRouter } from './mfa'
import { errorHandler } from '../../middleware/errorHandler'
import { resetAdminMfaSessions, setAdminMfaSession } from '../../lib/adminMfaSession'

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
  app.use('/admin/mfa', adminMfaRouter)
  app.use(errorHandler)
  return app
}

describe('Admin MFA routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAdminMfaSessions()
    prismaMock.user.findUnique.mockImplementation(async ({ where, select }: any) => {
      if (select?.role !== undefined) {
        return { role: 'ADMIN', isSuspended: false, mfaEnabled: false }
      }
      return { email: 'admin@test.com', mfaEnabled: false, mfaSecret: null }
    })
  })

  it('POST /setup generates a TOTP secret for an admin', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN', isSuspended: false, mfaEnabled: false })
      .mockResolvedValueOnce({ email: 'admin@test.com', mfaEnabled: false })
    prismaMock.user.update.mockResolvedValue({})
    const token = await tokenFor('admin-1')
    const app = buildApp()

    const res = await request(app).post('/admin/mfa/setup').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.secret).toBeTruthy()
    expect(res.body.data.otpauthUrl).toMatch(/otpauth:\/\/totp\//)
    expect(prismaMock.user.update).toHaveBeenCalled()
  })

  it('POST /enable verifies TOTP and enables MFA', async () => {
    const secret = authenticator.generateSecret()
    const code = authenticator.generate(secret)
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN', isSuspended: false, mfaEnabled: false })
      .mockResolvedValueOnce({ mfaSecret: secret, mfaEnabled: false })
    prismaMock.user.update.mockResolvedValue({ mfaEnabled: true })
    const token = await tokenFor('admin-1')
    const app = buildApp()

    const res = await request(app)
      .post('/admin/mfa/enable')
      .set('Authorization', `Bearer ${token}`)
      .send({ code })

    expect(res.status).toBe(200)
    expect(res.body.data.enabled).toBe(true)
  })

  it('POST /verify establishes an MFA session', async () => {
    const secret = authenticator.generateSecret()
    const code = authenticator.generate(secret)
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ role: 'ADMIN', isSuspended: false, mfaEnabled: true })
      .mockResolvedValueOnce({ mfaSecret: secret, mfaEnabled: true })
    const token = await tokenFor('admin-1')
    const app = buildApp()

    const res = await request(app)
      .post('/admin/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code })

    expect(res.status).toBe(200)
    expect(res.body.data.verified).toBe(true)
    setAdminMfaSession('admin-1')
  })
})
