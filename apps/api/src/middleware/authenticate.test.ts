import { describe, it, expect } from 'vitest'
import { SignJWT } from 'jose'
import { authenticate, AuthRequest } from './authenticate'
import { AppError } from './errorHandler'
import { mockRes, mockNext } from '../__tests__/testUtils'

const SECRET = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'] ?? 'fallback-secret')

async function signToken(payload: Record<string, unknown>, opts?: { expired?: boolean }) {
  const jwt = new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
  if (opts?.expired) {
    jwt.setExpirationTime(Math.floor(Date.now() / 1000) - 60)
  } else {
    jwt.setExpirationTime('30d')
  }
  return jwt.sign(SECRET)
}

function makeReq(authorization?: string): AuthRequest {
  return { headers: { authorization } } as unknown as AuthRequest
}

describe('authenticate middleware', () => {
  it('calls next() with no error and sets req.userId when token is valid', async () => {
    const token = await signToken({ sub: 'user-123' })
    const req = makeReq(`Bearer ${token}`)
    const res = mockRes()
    const next = mockNext()

    await authenticate(req, res, next)

    expect(req.userId).toBe('user-123')
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects when Authorization header is missing', async () => {
    const req = makeReq(undefined)
    const res = mockRes()
    const next = mockNext()

    await authenticate(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
  })

  it('rejects when token is malformed', async () => {
    const req = makeReq('Bearer not-a-real-jwt')
    const res = mockRes()
    const next = mockNext()

    await authenticate(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
  })

  it('rejects an expired token', async () => {
    const token = await signToken({ sub: 'user-123' }, { expired: true })
    const req = makeReq(`Bearer ${token}`)
    const res = mockRes()
    const next = mockNext()

    await authenticate(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
  })

  it('rejects a token signed with the wrong secret', async () => {
    const wrongSecret = new TextEncoder().encode('totally-different-secret')
    const token = await new SignJWT({ sub: 'user-123' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(wrongSecret)
    const req = makeReq(`Bearer ${token}`)
    const res = mockRes()
    const next = mockNext()

    await authenticate(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(401)
  })

  it('does not set req.userId when authentication fails', async () => {
    const req = makeReq('Bearer garbage')
    const res = mockRes()
    const next = mockNext()

    await authenticate(req, res, next)

    expect(req.userId).toBeUndefined()
  })
})
