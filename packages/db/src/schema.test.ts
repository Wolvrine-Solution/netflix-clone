import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from './testing'
import { Role, VideoQuality, MediaType } from './enums'
import { content, contentGenre, eq, genre, profile, user } from './index'

let t: TestDb
beforeAll(async () => {
  t = await createTestDb()
})
afterAll(() => t.close())
beforeEach(() => t.reset())

describe('schema and migrations', () => {
  it('applies all migrations on a fresh engine and exposes every table', async () => {
    const res = await t.db.execute(
      `select count(*)::int as n from information_schema.tables where table_schema = 'public'` as never
    )
    const n = (res as unknown as { rows: { n: number }[] }).rows[0]!.n
    expect(n).toBe(38)
  })

  it('generates cuid ids and createdAt/updatedAt defaults', async () => {
    const [u] = await t.db.insert(user).values({ email: 'a@x.dev' }).returning()
    expect(u!.id).toMatch(/^[a-z0-9]{20,}$/)
    expect(u!.role).toBe('USER')
    expect(u!.createdAt).toBeInstanceOf(Date)
    expect(u!.updatedAt).toBeInstanceOf(Date)
  })

  it('bumps updatedAt on update', async () => {
    const [u] = await t.db.insert(user).values({ email: 'a@x.dev' }).returning()
    await new Promise((r) => setTimeout(r, 15))
    const [after] = await t.db.update(user).set({ name: 'N' }).where(eq(user.id, u!.id)).returning()
    expect(after!.updatedAt.getTime()).toBeGreaterThan(u!.updatedAt.getTime())
  })

  it('enforces unique email and cascades profile deletes with the user', async () => {
    const [u] = await t.db.insert(user).values({ email: 'a@x.dev' }).returning()
    await expect(t.db.insert(user).values({ email: 'a@x.dev' })).rejects.toThrow()
    await t.db.insert(profile).values({ userId: u!.id, name: 'P', avatarUrl: 'a' })
    await t.db.delete(user).where(eq(user.id, u!.id))
    expect(await t.db.select().from(profile)).toHaveLength(0)
  })

  it('defaults array columns to empty and round-trips arrays', async () => {
    const [c] = await t.db
      .insert(content)
      .values({
        mediaType: 'movie',
        title: 'T',
        description: 'd',
        posterPath: 'p',
        backdropPath: 'b',
        releaseDate: '2024',
        rating: 1,
      })
      .returning()
    expect(c!.cast).toEqual([])
    const [c2] = await t.db
      .update(content)
      .set({ cast: ['A', 'B'] })
      .where(eq(content.id, c!.id))
      .returning()
    expect(c2!.cast).toEqual(['A', 'B'])
  })

  it('composite-key join tables prevent duplicates and resolve relations', async () => {
    const [c] = await t.db
      .insert(content)
      .values({
        mediaType: 'tv',
        title: 'T',
        description: 'd',
        posterPath: 'p',
        backdropPath: 'b',
        releaseDate: '2024',
        rating: 1,
      })
      .returning()
    await t.db.insert(genre).values({ id: 18, name: 'Drama' })
    await t.db.insert(contentGenre).values({ contentId: c!.id, genreId: 18 })
    await expect(
      t.db.insert(contentGenre).values({ contentId: c!.id, genreId: 18 })
    ).rejects.toThrow()
    const found = await t.db.query.content.findFirst({
      where: eq(content.id, c!.id),
      with: { genres: { with: { genre: true } } },
    })
    expect(found!.genres[0]!.genre.name).toBe('Drama')
  })
})

describe('enum exports (Prisma-compatible shape)', () => {
  it('exposes value objects matching the database enums', () => {
    expect(Role.ADMIN).toBe('ADMIN')
    expect(VideoQuality.Q_1080P).toBe('Q_1080P')
    expect(Object.keys(MediaType).sort()).toEqual(['movie', 'tv'])
  })
})
