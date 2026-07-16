import { describe, it, expect } from 'vitest'
import { SignJWT, jwtVerify } from 'jose'
import { signAccessToken, verifyAccessToken } from '../lib/jwt'

describe('web→API JWT compatibility (G11)', () => {
  const secret = new TextEncoder().encode(process.env['NEXTAUTH_SECRET']!)

  it('API signAccessToken verifies with jose.jwtVerify (same as authenticate middleware)', async () => {
    const token = await signAccessToken({
      sub: 'user-integration-1',
      email: 'test@example.com',
      name: 'Test User',
    })
    const payload = await verifyAccessToken(token)
    expect(payload.sub).toBe('user-integration-1')
    expect(payload['email']).toBe('test@example.com')
  })

  it('web-style SignJWT (HS256, 15m) is accepted by API verifier', async () => {
    const token = await new SignJWT({ email: 'web@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-web-1')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret)

    const { payload } = await jwtVerify(token, secret)
    expect(payload.sub).toBe('user-web-1')

    const apiPayload = await verifyAccessToken(token)
    expect(apiPayload.sub).toBe('user-web-1')
  })
})
