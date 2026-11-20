import helmet from '@fastify/helmet'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { getCorsOrigins } from './config/env'
import { registerCacheControl } from './common/cache-control'
import { registerRequestIdHeader } from './common/request-id'

// bigint columns (e.g. VideoFile.size) must serialize as numbers.
;(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function (this: bigint) {
  return Number(this)
}

/** Shared by main.ts and the test harness so tests exercise the same HTTP surface. */
export async function configureApp(app: NestFastifyApplication, opts: { logger?: boolean } = {}) {
  if (opts.logger !== false) app.useLogger(app.get(Logger))
  registerRequestIdHeader(app.getHttpAdapter().getInstance())
  registerCacheControl(app.getHttpAdapter().getInstance())
  await app.register(helmet as unknown as Parameters<typeof app.register>[0])
  app.enableCors({ origin: getCorsOrigins(), credentials: true })

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle('Streaming API').setVersion('1.0.0').addBearerAuth().build()
  )
  SwaggerModule.setup('api/v1/docs', app, doc, {
    ui: false,
    jsonDocumentUrl: 'api/v1/openapi.json',
  })
}
