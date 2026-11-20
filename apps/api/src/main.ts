import 'reflect-metadata'
import { resolve } from 'node:path'
import { runMigrations } from '@netflix/db'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { configureApp } from './app.setup'
import { genRequestId } from './common/request-id'
import { getEnv } from './config/env'
import { initObservability } from './lib/observability'

function parseBytes(v: string): number {
  const m = /^(\d+)\s*(b|kb|mb)?$/i.exec(v.trim())
  if (!m) return 1_048_576
  const n = Number(m[1])
  const unit = (m[2] ?? 'b').toLowerCase()
  return unit === 'mb' ? n * 1_048_576 : unit === 'kb' ? n * 1024 : n
}

async function bootstrap() {
  const env = getEnv()
  initObservability()
  if (env.RUN_MIGRATIONS) {
    // dist/main.js -> repo root in a checkout; /app/drizzle in the image (MIGRATIONS_DIR).
    await runMigrations(
      process.env['MIGRATIONS_DIR'] ?? resolve(__dirname, '../../../packages/db/drizzle')
    )
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      genReqId: genRequestId,
      bodyLimit: parseBytes(env.JSON_BODY_LIMIT),
      trustProxy: true,
    }),
    // rawBody: Stripe signs the exact bytes it sent.
    { rawBody: true, bufferLogs: true }
  )
  app.enableShutdownHooks()
  await configureApp(app)
  await app.listen(env.PORT, '0.0.0.0')
}

void bootstrap()
