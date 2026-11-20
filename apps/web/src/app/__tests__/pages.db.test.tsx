// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createTestDb, type TestDb } from '@netflix/db/testing'

const holder = vi.hoisted(() => ({ db: undefined as unknown }))
vi.mock('@netflix/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@netflix/db')>()
  return { ...actual, db: new Proxy({}, { get: (_t, p) => Reflect.get(holder.db as object, p) }) }
})
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT:${to}`)
  },
}))

import {
  content,
  contentGenre,
  contentRow,
  episode,
  genre,
  row,
  season,
  videoFile,
} from '@netflix/db'
import BrowsePage from '../(main)/browse/page'
import MoviesPage from '../(main)/browse/movies/page'
import TVPage from '../(main)/browse/tv/page'
import WatchPage from '../(main)/watch/[contentId]/page'

let testDb: TestDb
let movieId: string
let showId: string

const json = (node: unknown) =>
  JSON.stringify(node, (_k, v) => (typeof v === 'bigint' ? Number(v) : v))

beforeAll(async () => {
  testDb = await createTestDb()
  holder.db = testDb.db
  const db = testDb.db
  const base = { description: 'd', posterPath: 'p', backdropPath: 'b', releaseDate: '2024' }
  const [m] = await db
    .insert(content)
    .values({ ...base, mediaType: 'movie', title: 'Movie Smoke', rating: 9, isFeatured: true })
    .returning()
  const [s] = await db
    .insert(content)
    .values({ ...base, mediaType: 'tv', title: 'Show Smoke', rating: 7 })
    .returning()
  movieId = m!.id
  showId = s!.id
  await db.insert(genre).values({ id: 7, name: 'Drama' })
  await db.insert(contentGenre).values({ contentId: movieId, genreId: 7 })
  await db.insert(videoFile).values({ contentId: movieId, url: 'movie.mp4', isDefault: true })
  const [r] = await db.insert(row).values({ title: 'Row One', query: 'q', order: 0 }).returning()
  await db.insert(contentRow).values({ rowId: r!.id, contentId: movieId, order: 0 })
  const [se] = await db.insert(season).values({ contentId: showId, seasonNumber: 1 }).returning()
  const [ep] = await db
    .insert(episode)
    .values({ seasonId: se!.id, episodeNumber: 1, title: 'Pilot' })
    .returning()
  await db.insert(videoFile).values({ episodeId: ep!.id, url: 'ep1.mp4', isDefault: true })
})
afterAll(() => testDb.close())

describe('web pages run their ported Drizzle queries', () => {
  it('browse: featured content and rows with nested contents', async () => {
    const out = json(await BrowsePage())
    expect(out).toContain('Movie Smoke')
    expect(out).toContain('Row One')
    expect(out).toContain('Drama')
  })

  it('movies and tv listings filter by media type', async () => {
    const movies = json(await MoviesPage())
    expect(movies).toContain('Movie Smoke')
    expect(movies).not.toContain('Show Smoke')
    const tv = json(await TVPage())
    expect(tv).toContain('Show Smoke')
    expect(tv).not.toContain('Movie Smoke')
  })

  it('watch: movie uses its default video file', async () => {
    const el = (await WatchPage({ params: { contentId: movieId }, searchParams: {} })) as unknown
    expect(json(el)).toContain('movie.mp4')
  })

  it('watch: tv resolves season/episode and episode video url', async () => {
    const el = json(await WatchPage({ params: { contentId: showId }, searchParams: {} }))
    expect(el).toContain('ep1.mp4')
    expect(el).toContain('Pilot')
  })

  it('watch: unknown content redirects to /browse', async () => {
    await expect(WatchPage({ params: { contentId: 'missing' }, searchParams: {} })).rejects.toThrow(
      'NEXT_REDIRECT:/browse'
    )
  })
})
