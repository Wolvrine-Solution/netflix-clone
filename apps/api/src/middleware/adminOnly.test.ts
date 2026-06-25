import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockRes, mockNext } from '../__tests__/testUtils'

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
}))
vi.mock('@netflix/db', () => ({ prisma: prismaMock }))

import { adminOnly } from './adminOnly'
import { AppError } from './errorHandler'
import type { AuthRequest } from './authenticate'

describe('adminOnly middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects when req.userId is not set (unauthenticated)', async () => {
    const req = {} as AuthRequest
    const res = mockRes()
    const next = mockNext()

    await adminOnly(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
  })

  it('rejects when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const req = { userId: 'missing-user' } as AuthRequest
    const res = mockRes()
    const next = mockNext()

    await adminOnly(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err.statusCode).toBe(403)
  })

  it('rejects when user role is not ADMIN', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: 'USER', isSuspended: false })
    const req = { userId: 'user-1' } as AuthRequest
    const res = mockRes()
    const next = mockNext()

    await adminOnly(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err.statusCode).toBe(403)
    expect(err.message).toMatch(/admin access required/i)
  })

  it('rejects a suspended admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: 'ADMIN', isSuspended: true })
    const req = { userId: 'admin-1' } as AuthRequest
    const res = mockRes()
    const next = mockNext()

    await adminOnly(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err.statusCode).toBe(403)
    expect(err.message).toMatch(/suspended/i)
  })

  it('allows an active admin through', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: 'ADMIN', isSuspended: false })
    const req = { userId: 'admin-1' } as AuthRequest
    const res = mockRes()
    const next = mockNext()

    await adminOnly(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'admin-1' },
      select: { role: true, isSuspended: true },
    })
  })
})
