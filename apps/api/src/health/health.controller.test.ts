import { Test } from '@nestjs/testing'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { LoggerModule } from 'nestjs-pino'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const ping = vi.hoisted(() => vi.fn())
vi.mock('@netflix/db', async (orig) => ({ ...(await orig<typeof import('@netflix/db')>()), pingDb: ping }))

import { HealthModule } from './health.module'

let app: NestFastifyApplication
beforeAll(async () => {
  const ref = await Test.createTestingModule({
    imports: [LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }), HealthModule],
  }).compile()
  app = ref.createNestApplication<NestFastifyApplication>(new FastifyAdapter())
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
})
afterAll(() => app.close())

describe('health', () => {
  it('/health is always ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('/ready is 200 when the database answers and 503 when it does not', async () => {
    ping.mockResolvedValueOnce(undefined)
    const ok = await app.inject({ method: 'GET', url: '/ready' })
    expect(ok.statusCode).toBe(200)
    expect(ok.json()).toEqual({ status: 'ready', database: 'connected' })

    ping.mockRejectedValueOnce(new Error('down'))
    const bad = await app.inject({ method: 'GET', url: '/ready' })
    expect(bad.statusCode).toBe(503)
    expect(bad.json()).toMatchObject({ status: 'not_ready', database: 'disconnected' })
  })
})
