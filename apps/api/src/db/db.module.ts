import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common'
import { closeDb, db } from '@netflix/db'
import { DB } from '../common/tokens'

/** The database as an injectable dependency, so tests can substitute an in-process Postgres. */
@Global()
@Module({
  providers: [{ provide: DB, useValue: db }],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DB) _db: unknown) {}

  async onApplicationShutdown(): Promise<void> {
    await closeDb()
  }
}
