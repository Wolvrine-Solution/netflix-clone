import { SignJWT, jwtVerify } from 'jose'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '@netflix/db/testing'
import { refreshToken, user } from '@netflix/db'
import { getEnv } from '../config/env'
import { TokenService } from '../modules/auth/token.service'

const secret = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'])
let tdb: TestDb
let tokens: TokenService
beforeAll(async () => {
  tdb = await createTestDb()
  tokens = new TokenService(tdb.db, getEnv())
})
afterAll(() => tdb.close())
beforeEach(() => tdb.reset())

describe('web→API JWT compatibility (G11)', () => {
  it('API-signed access tokens verify with plain jose.jwtVerify', async () => {
    const token = await tokens.signAccessToken({ sub: 'u1', email: 'test@example.com', name: 'T' })
    const { payload } = await jwtVerify(token, secret)
    expect(payload.sub).toBe('u1')
    expect(payload['email']).toBe('test@example.com')
    expect((await tokens.verifyAccessToken(token)).sub).toBe('u1')
  })

  it('web-style HS256 tokens are accepted by the API verifier', async () => {
    const token = await new SignJWT({ email: 'web@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-web-1')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret)
    expect((await tokens.verifyAccessToken(token)).sub).toBe('user-web-1')
  })
})

describe('refresh tokens', () => {
  it('stores only a hash, rotates once, and revokeAll invalidates outstanding tokens', async () => {
    const [u] = await tdb.db.insert(user).values({ email: 'r@x.dev' }).returning()
    const raw = await tokens.issueRefreshToken(u!.id)
    const rows = await tdb.db.select().from(refreshToken)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.tokenHash).not.toBe(raw)

    const next = await tokens.rotateRefreshToken(raw)
    expect(next?.refreshToken).toBeTruthy()
    expect(await tokens.rotateRefreshToken(raw)).toBeNull()

    await tokens.revokeAllRefreshTokens(u!.id)
    expect(await tokens.rotateRefreshToken(next!.refreshToken)).toBeNull()
  })

  it('rejects expired and unknown refresh tokens', async () => {
    expect(await tokens.rotateRefreshToken('unknown')).toBeNull()
  })
})
