import { Controller, Get, Inject, Post, UseGuards } from '@nestjs/common'
import { SignJWT } from 'jose'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq, user } from '@netflix/db'
import { AdminMfaSessionService } from '../modules/auth/admin-mfa-session.service'
import { TokenService } from '../modules/auth/token.service'
import { createMiniApp } from '../../test/mini-app'
import { AdminBaseGuard, AdminGuard } from './admin.guard'
import { AppError } from './app-error'
import { JwtAuthGuard, OptionalAuthGuard } from './auth.guard'
import { UserId } from './decorators'

const SECRET = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'])

@Controller('t')
class TestController {
  constructor(@Inject(TokenService) _t: TokenService) {}

  @Get('private')
  @UseGuards(JwtAuthGuard)
  priv(@UserId() id: string) {
    return { id }
  }

  @Get('optional')
  @UseGuards(OptionalAuthGuard)
  opt(@UserId() id?: string) {
    return { id: id ?? null }
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  admin() {
    return { ok: true }
  }

  @Get('admin-base')
  @UseGuards(AdminBaseGuard)
  adminBase() {
    return { ok: true }
  }

  @Post('boom')
  boom() {
    throw new Error('leaked secret database connection string')
  }

  @Post('app-error')
  appError() {
    throw new AppError(404, 'Profile not found')
  }
}

async function jwt(sub: string | undefined, opts: { expired?: boolean; secret?: Uint8Array } = {}) {
  const j = new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
  if (sub) j.setSubject(sub)
  j.setExpirationTime(opts.expired ? Math.floor(Date.now() / 1000) - 60 : '1h')
  return j.sign(opts.secret ?? SECRET)
}

let h: Awaited<ReturnType<typeof createMiniApp>>
beforeAll(async () => {
  h = await createMiniApp([TestController])
})
afterAll(() => h.close())
beforeEach(() => h.reset())

const get = (url: string, token?: string) =>
  h.app.inject({ method: 'GET', url, headers: token ? { authorization: `Bearer ${token}` } : {} })

describe('JwtAuthGuard', () => {
  it('sets the user id for a valid token', async () => {
    const res = await get('/t/private', await jwt('user-123'))
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ id: 'user-123' })
  })

  it.each([
    ['missing header', async () => undefined],
    ['expired token', async () => jwt('u', { expired: true })],
    ['wrong signature', async () => jwt('u', { secret: new TextEncoder().encode('x'.repeat(40)) })],
    ['token without sub', async () => jwt(undefined)],
    ['garbage', async () => 'not.a.jwt'],
  ])('rejects %s with 401', async (_n, make) => {
    const res = await get('/t/private', await make())
    expect(res.statusCode).toBe(401)
    expect(res.json()).toMatchObject({
      error: 'AppError',
      message: 'Unauthorized',
      statusCode: 401,
    })
  })
})

describe('OptionalAuthGuard', () => {
  it('passes through anonymously and with a valid token, ignores bad tokens', async () => {
    expect((await get('/t/optional')).json()).toEqual({ id: null })
    expect((await get('/t/optional', await jwt('u1'))).json()).toEqual({ id: 'u1' })
    expect((await get('/t/optional', 'garbage')).json()).toEqual({ id: null })
  })
})

describe('AdminGuard / AdminBaseGuard', () => {
  async function admin(over: Partial<typeof user.$inferInsert> = {}) {
    const [u] = await h.db
      .insert(user)
      .values({ email: `a${Math.random()}@x.dev`, role: 'ADMIN', ...over })
      .returning()
    return u!
  }

  it('401 without a token, 403 for non-admin and unknown users', async () => {
    expect((await get('/t/admin')).statusCode).toBe(401)
    const [u] = await h.db.insert(user).values({ email: 'u@x.dev' }).returning()
    const res = await get('/t/admin', await jwt(u!.id))
    expect(res.statusCode).toBe(403)
    expect(res.json().message).toMatch(/admin access required/i)
    expect((await get('/t/admin', await jwt('ghost'))).statusCode).toBe(403)
  })

  it('403 for a suspended admin', async () => {
    const a = await admin({ isSuspended: true })
    const res = await get('/t/admin', await jwt(a.id))
    expect(res.statusCode).toBe(403)
    expect(res.json().message).toMatch(/suspended/i)
  })

  it('lets an active admin without MFA through', async () => {
    const a = await admin()
    expect((await get('/t/admin', await jwt(a.id))).statusCode).toBe(200)
  })

  it('requires a verified MFA session when MFA is enabled', async () => {
    const a = await admin({ mfaEnabled: true })
    const token = await jwt(a.id)
    const denied = await get('/t/admin', token)
    expect(denied.statusCode).toBe(403)
    expect(denied.json().message).toMatch(/MFA verification required/i)

    h.app.get(AdminMfaSessionService).set(a.id)
    expect((await get('/t/admin', token)).statusCode).toBe(200)
    h.app.get(AdminMfaSessionService).clear(a.id)
    expect((await get('/t/admin', token)).statusCode).toBe(403)
  })

  it('AdminBaseGuard does not need an MFA session', async () => {
    const a = await admin({ mfaEnabled: true })
    expect((await get('/t/admin-base', await jwt(a.id))).statusCode).toBe(200)
    await h.db.update(user).set({ role: 'USER' }).where(eq(user.id, a.id))
    expect((await get('/t/admin-base', await jwt(a.id))).statusCode).toBe(403)
  })
})

describe('AllExceptionsFilter', () => {
  it('keeps the AppError body shape and includes the request id', async () => {
    const res = await h.app.inject({
      method: 'POST',
      url: '/t/app-error',
      headers: { 'x-request-id': 'req-abc' },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toEqual({
      error: 'AppError',
      message: 'Profile not found',
      statusCode: 404,
      requestId: 'req-abc',
    })
  })

  it('returns a generic 500 and never leaks the original message', async () => {
    const res = await h.app.inject({ method: 'POST', url: '/t/boom' })
    expect(res.statusCode).toBe(500)
    expect(res.json()).toMatchObject({
      error: 'InternalServerError',
      message: 'Something went wrong',
      statusCode: 500,
    })
    expect(res.body).not.toContain('leaked secret')
  })

  it('maps unknown routes to a 404 body in the same shape', async () => {
    const res = await get('/t/nope')
    expect(res.statusCode).toBe(404)
    expect(res.json()).toHaveProperty('requestId')
  })
})
