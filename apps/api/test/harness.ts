import 'reflect-metadata'
import { hash } from 'bcryptjs'
import { SignJWT } from 'jose'
import { Test } from '@nestjs/testing'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { ThrottlerGuard } from '@nestjs/throttler'
import { content, genre, contentGenre, profile, user, type Database } from '@netflix/db'
import { createTestDb, type TestDb } from '@netflix/db/testing'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'
import { genRequestId } from '../src/common/request-id'
import { DB } from '../src/common/tokens'

// bigint columns (VideoFile.size) must serialize like they do in main.ts
;(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function (this: bigint) {
  return Number(this)
}

export interface Res<T = any> {
  status: number
  body: T
  headers: Record<string, string | string[] | number | undefined>
}

export interface TestApp {
  app: NestFastifyApplication
  db: Database
  reset(): Promise<void>
  close(): Promise<void>
  /** Mint an access token the API accepts. */
  token(userId: string, extra?: Record<string, unknown>): Promise<string>
  request(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    opts?: { body?: unknown; token?: string; headers?: Record<string, string> }
  ): Promise<Res>
  seedUser(
    o?: Partial<{ email: string; password: string; role: 'USER' | 'ADMIN'; name: string }>
  ): Promise<typeof user.$inferSelect>
  seedProfile(
    userId: string,
    o?: Partial<{ name: string; isKid: boolean }>
  ): Promise<typeof profile.$inferSelect>
  seedContent(
    o?: Partial<typeof content.$inferInsert> & { genres?: string[] }
  ): Promise<typeof content.$inferSelect>
}

let seq = 0

export async function createTestApp(): Promise<TestApp> {
  const testDb: TestDb = await createTestDb()

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DB)
    .useValue(testDb.db)
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile()

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ genReqId: genRequestId }),
    { rawBody: true }
  )
  await configureApp(app, { logger: false })
  await app.init()
  await app.getHttpAdapter().getInstance().ready()

  const secret = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'])
  const db = testDb.db

  return {
    app,
    db,
    reset: () => testDb.reset(),
    async close() {
      await app.close()
      await testDb.close()
    },
    async token(userId, extra = {}) {
      return new SignJWT(extra)
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret)
    },
    async request(method, url, opts = {}) {
      const res = await app.inject({
        method,
        url,
        payload: opts.body as object | undefined,
        headers: {
          ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
          ...opts.headers,
        },
      })
      let body: unknown = res.body
      try {
        body = res.json()
      } catch {
        // non-JSON body
      }
      return { status: res.statusCode, body, headers: res.headers }
    },
    async seedUser(o = {}) {
      seq++
      const [u] = await db
        .insert(user)
        .values({
          email: o.email ?? `user${seq}@test.dev`,
          name: o.name ?? `User ${seq}`,
          hashedPassword: await hash(o.password ?? 'password123', 4),
          role: o.role ?? 'USER',
        })
        .returning()
      return u!
    },
    async seedProfile(userId, o = {}) {
      seq++
      const [p] = await db
        .insert(profile)
        .values({
          userId,
          name: o.name ?? `Profile ${seq}`,
          avatarUrl: 'a.png',
          isKid: o.isKid ?? false,
        })
        .returning()
      return p!
    },
    async seedContent(o = {}) {
      seq++
      const { genres: genreNames, ...rest } = o
      const [c] = await db
        .insert(content)
        .values({
          mediaType: 'movie',
          title: `Title ${seq}`,
          description: 'desc',
          posterPath: 'p.jpg',
          backdropPath: 'b.jpg',
          releaseDate: '2024-01-01',
          rating: 7,
          ...rest,
        })
        .returning()
      for (const name of genreNames ?? []) {
        const [g] = await db
          .insert(genre)
          .values({ id: 1000 + seq * 10 + (genreNames?.indexOf(name) ?? 0), name })
          .onConflictDoNothing()
          .returning()
        const gid =
          g?.id ?? (await db.query.genre.findFirst({ where: (t, { eq }) => eq(t.name, name) }))!.id
        await db.insert(contentGenre).values({ contentId: c!.id, genreId: gid })
      }
      return c!
    },
  }
}
