import 'reflect-metadata'
import { Module, type Type } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { LoggerModule } from 'nestjs-pino'
import { createTestDb, type TestDb } from '@netflix/db/testing'
import { AllExceptionsFilter } from '../src/common/all-exceptions.filter'
import { CoreModule } from '../src/common/core.module'
import { genRequestId } from '../src/common/request-id'
import { DB } from '../src/common/tokens'
import { DbModule } from '../src/db/db.module'

/** A tiny Nest app around a few controllers, with the real guards/filter and a PGlite database. */
export async function createMiniApp(controllers: Type[]) {
  const testDb: TestDb = await createTestDb()

  @Module({
    imports: [LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }), DbModule, CoreModule],
    controllers,
    providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
  })
  class MiniModule {}

  const ref = await Test.createTestingModule({ imports: [MiniModule] })
    .overrideProvider(DB)
    .useValue(testDb.db)
    .compile()
  const app = ref.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ genReqId: genRequestId })
  )
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
  return {
    app,
    db: testDb.db,
    reset: () => testDb.reset(),
    async close() {
      await app.close()
      await testDb.close()
    },
  }
}
