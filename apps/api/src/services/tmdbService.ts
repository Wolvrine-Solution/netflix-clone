import { getRedis } from '../lib/redis'
import { getEnv } from './env'

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const env = getEnv()
  const TMDB_BASE = env.TMDB_BASE_URL
  const API_KEY = env.TMDB_API_KEY ?? ''
  const cacheKey = `tmdb:${path}:${JSON.stringify(params)}`
  const redis = await getRedis()
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached) as T

  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`)
  const data = (await res.json()) as T
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600)
  return data
}

export async function searchTMDB(query: string): Promise<import('@netflix/types').ContentItem[]> {
  const API_KEY = getEnv().TMDB_API_KEY ?? ''
  if (!API_KEY) return []
  const data = await tmdbFetch<{
    results: Array<{
      id: number
      media_type: string
      title?: string
      name?: string
      overview: string
      poster_path: string | null
      backdrop_path: string | null
      vote_average: number
      release_date?: string
      first_air_date?: string
    }>
  }>('/search/multi', { query, page: '1' })
  return data.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 20)
    .map((r) => ({
      id: String(r.id),
      tmdbId: r.id,
      title: r.title ?? r.name ?? 'Unknown',
      description: r.overview,
      posterPath: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : '',
      backdropPath: r.backdrop_path ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` : '',
      releaseDate: r.release_date ?? r.first_air_date ?? '',
      rating: r.vote_average,
      mediaType: r.media_type as 'movie' | 'tv',
      genres: [],
      maturityRating: 'TV-MA',
      isFeatured: false,
      status: 'PUBLISHED' as import('@netflix/types').ContentStatus,
      language: 'en',
      cast: [],
    }))
}

export async function getContentFromDB(
  id: string
): Promise<import('@netflix/types').ContentItem | null> {
  const { prisma } = await import('@netflix/db')
  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      genres: { include: { genre: true } },
      videoFiles: { orderBy: { isDefault: 'desc' } },
      contentSeasons: {
        orderBy: { seasonNumber: 'asc' },
        include: {
          episodes: {
            orderBy: { episodeNumber: 'asc' },
            include: { videoFiles: { orderBy: { isDefault: 'desc' } } },
          },
        },
      },
    },
  })
  if (!content) return null
  return {
    id: content.id,
    tmdbId: content.tmdbId,
    title: content.title,
    description: content.description,
    posterPath: content.posterPath,
    backdropPath: content.backdropPath,
    releaseDate: content.releaseDate,
    rating: content.rating,
    mediaType: content.mediaType,
    genres: content.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
    runtime: content.runtime ?? undefined,
    seasons:
      content.contentSeasons.length > 0
        ? content.contentSeasons.length
        : (content.seasons ?? undefined),
    episodes: content.episodes ?? undefined,
    maturityRating: content.maturityRating,
    trailerKey: content.trailerKey ?? undefined,
    isFeatured: content.isFeatured,
    status: content.status as import('@netflix/types').ContentStatus,
    language: content.language,
    country: content.country ?? undefined,
    studio: content.studio ?? undefined,
    director: content.director ?? undefined,
    tagline: content.tagline ?? undefined,
    cast: content.cast,
    videoUrl: content.videoUrl ?? undefined,
    videoFiles: content.videoFiles,
    contentSeasons: content.contentSeasons.map((s) => ({
      id: s.id,
      contentId: content.id,
      seasonNumber: s.seasonNumber,
      title: s.title ?? undefined,
      description: s.description ?? undefined,
      posterPath: s.posterPath ?? undefined,
      airDate: s.airDate ?? undefined,
      episodes: s.episodes.map((e) => ({
        id: e.id,
        seasonId: s.id,
        episodeNumber: e.episodeNumber,
        title: e.title,
        description: e.description ?? undefined,
        stillPath: e.stillPath ?? undefined,
        runtime: e.runtime ?? undefined,
        airDate: e.airDate ?? undefined,
        videoUrl: e.videoUrl ?? undefined,
        videoFiles: e.videoFiles,
      })),
    })),
  }
}
