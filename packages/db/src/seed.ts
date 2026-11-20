import {
  db,
  closeDb,
  genre as genreTable,
  content as contentTable,
  contentGenre,
  row as rowTable,
  contentRow,
  eq,
} from './index'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = process.env['TMDB_API_KEY'] ?? ''

async function tmdbFetch<T = Record<string, unknown>>(path: string): Promise<T> {
  const url = `${TMDB_BASE}${path}?api_key=${API_KEY}&language=en-US`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.statusText}`)
  return res.json() as Promise<T>
}

async function getTrailerKey(tmdbId: number, mediaType: 'movie' | 'tv'): Promise<string | null> {
  try {
    const data = await tmdbFetch(`/${mediaType}/${tmdbId}/videos`)
    const trailers = (
      data.results as Array<{ type: string; site: string; key: string; official: boolean }>
    )
      .filter((v) => v.type === 'Trailer' && v.site === 'YouTube')
      .sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0))
    return trailers[0]?.key ?? null
  } catch {
    return null
  }
}

async function upsertGenres(genres: Array<{ id: number; name: string }>) {
  for (const genre of genres) {
    await db
      .insert(genreTable)
      .values({ id: genre.id, name: genre.name })
      .onConflictDoUpdate({ target: genreTable.id, set: { name: genre.name } })
  }
}

interface TMDBItem {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  genre_ids?: number[]
  genres?: Array<{ id: number; name: string }>
  runtime?: number
  number_of_seasons?: number
  number_of_episodes?: number
}

async function importContent(item: TMDBItem, mediaType: 'movie' | 'tv') {
  const trailerKey = await getTrailerKey(item.id, mediaType)
  const title = item.title ?? item.name ?? 'Unknown'
  const releaseDate = item.release_date ?? item.first_air_date ?? ''
  const genreIds: number[] = item.genre_ids ?? item.genres?.map((g) => g.id) ?? []

  const [content] = await db
    .insert(contentTable)
    .values({
      tmdbId: item.id,
      mediaType,
      title,
      description: item.overview,
      posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
      backdropPath: item.backdrop_path
        ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
        : '',
      trailerKey,
      releaseDate,
      rating: item.vote_average,
      runtime: item.runtime ?? null,
      seasons: item.number_of_seasons ?? null,
      episodes: item.number_of_episodes ?? null,
      maturityRating: mediaType === 'movie' ? 'R' : 'TV-MA',
    })
    .onConflictDoUpdate({
      target: contentTable.tmdbId,
      set: { trailerKey, rating: item.vote_average },
    })
    .returning()
  if (!content) throw new Error('content upsert returned no row')

  for (const genreId of genreIds) {
    const [genreExists] = await db.select().from(genreTable).where(eq(genreTable.id, genreId))
    if (genreExists) {
      await db.insert(contentGenre).values({ contentId: content.id, genreId }).onConflictDoNothing()
    }
  }

  return content
}

async function main() {
  if (!API_KEY) {
    console.log('No TMDB_API_KEY set — skipping seed. Set TMDB_API_KEY and run again.')
    return
  }

  interface GenreList {
    genres: Array<{ id: number; name: string }>
  }
  interface PageResult {
    results?: TMDBItem[]
  }

  console.log('Seeding genres...')
  const movieGenres = await tmdbFetch<GenreList>('/genre/movie/list')
  const tvGenres = await tmdbFetch<GenreList>('/genre/tv/list')
  await upsertGenres([...movieGenres.genres, ...tvGenres.genres])

  const rowDefs = [
    { title: 'Trending Now', query: 'trending', order: 0, endpoint: '/trending/all/week' },
    {
      title: 'Top Rated Movies',
      query: 'top_rated_movies',
      order: 1,
      endpoint: '/movie/top_rated',
    },
    { title: 'Popular TV Shows', query: 'popular_tv', order: 2, endpoint: '/tv/popular' },
    {
      title: 'Action & Adventure',
      query: 'action',
      order: 3,
      endpoint: '/discover/movie?with_genres=28',
    },
    { title: 'Comedy', query: 'comedy', order: 4, endpoint: '/discover/movie?with_genres=35' },
    { title: 'Drama', query: 'drama', order: 5, endpoint: '/discover/tv?with_genres=18' },
    {
      title: 'Sci-Fi & Fantasy',
      query: 'scifi',
      order: 6,
      endpoint: '/discover/movie?with_genres=878',
    },
    { title: 'Horror', query: 'horror', order: 7, endpoint: '/discover/movie?with_genres=27' },
  ]

  for (const rowDef of rowDefs) {
    console.log(`Seeding row: ${rowDef.title}`)
    const data = await tmdbFetch<PageResult>(rowDef.endpoint)
    const items: TMDBItem[] = data.results?.slice(0, 20) ?? []

    const [row] = await db
      .insert(rowTable)
      .values({
        id: `row-${rowDef.query}`,
        title: rowDef.title,
        query: rowDef.query,
        order: rowDef.order,
      })
      .onConflictDoUpdate({
        target: rowTable.id,
        set: { title: rowDef.title, order: rowDef.order },
      })
      .returning()
    if (!row) throw new Error('row upsert returned no row')

    let order = 0
    for (const item of items) {
      const mediaType: 'movie' | 'tv' =
        rowDef.endpoint.includes('/tv') || (item as { media_type?: string }).media_type === 'tv'
          ? 'tv'
          : 'movie'
      const content = await importContent(item, mediaType)
      await db
        .insert(contentRow)
        .values({ contentId: content.id, rowId: row.id, order })
        .onConflictDoUpdate({
          target: [contentRow.contentId, contentRow.rowId],
          set: { order },
        })
      order++
    }
  }

  console.log('Marking featured content...')
  const trending = await tmdbFetch<PageResult>('/trending/movie/week')
  const featured: TMDBItem | undefined = trending.results?.[0]
  if (featured) {
    const details = await tmdbFetch<TMDBItem>(`/movie/${featured.id}`)
    const content = await importContent({ ...featured, ...details }, 'movie')
    await db.update(contentTable).set({ isFeatured: true }).where(eq(contentTable.id, content.id))
  }

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => closeDb())
