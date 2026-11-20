import { Controller, Get, Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { SkipThrottle, Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { Test } from '@nestjs/testing'
import { LoggerModule } from 'nestjs-pino'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { AllExceptionsFilter } from './all-exceptions.filter'

@Controller()
class C {
  @Get('a')
  a() {
    return { ok: true }
  }
  @Get('tight')
  @Throttle({ default: { ttl: 60_000, limit: 1 } })
  tight() {
    return { ok: true }
  }
  @Get('free')
  @SkipThrottle()
  free() {
    return { ok: true }
  }
}

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 3 }]),
  ],
  controllers: [C],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
class M {}

let app: NestFastifyApplication
beforeAll(async () => {
  const ref = await Test.createTestingModule({ imports: [M] }).compile()
  app = ref.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
})
afterAll(() => app.close())

describe('rate limiting', () => {
  it('returns the legacy 429 body after the global limit', async () => {
    const codes: number[] = []
    for (let i = 0; i < 4; i++)
      codes.push((await app.inject({ method: 'GET', url: '/a' })).statusCode)
    expect(codes).toEqual([200, 200, 200, 429])
    const res = await app.inject({ method: 'GET', url: '/a' })
    expect(res.json()).toMatchObject({
      error: 'TooManyRequests',
      message: 'Too many requests',
      statusCode: 429,
    })
  })

  it('applies a tighter per-route limit and honours SkipThrottle', async () => {
    expect((await app.inject({ method: 'GET', url: '/tight' })).statusCode).toBe(200)
    expect((await app.inject({ method: 'GET', url: '/tight' })).statusCode).toBe(429)
    for (let i = 0; i < 10; i++)
      expect((await app.inject({ method: 'GET', url: '/free' })).statusCode).toBe(200)
  })
})
