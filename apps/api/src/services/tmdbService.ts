import NodeCache from 'node-cache'
import { prisma } from '@netflix/db'
import type { ContentItem } from '@netflix/types'

const cache = new NodeCache({ stdTTL: 3600 })
const TMDB_BASE = process.env['TMDB_BASE_URL'] ?? 'https://api.themoviedb.org/3'
const API_KEY = process.env['TMDB_API_KEY'] ?? ''

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const cacheKey = `tmdb:${path}:${JSON.stringify(params)}`
  const cached = cache.get<T>(cacheKey)
  if (cached) return cached

  const url = new URL(`${TMDB_BASE}${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`)
  const data = await res.json() as T
  cache.set(cacheKey, data)
  return data
}

export async function searchTMDB(query: string): Promise<ContentItem[]> {
  if (!API_KEY) return []
  const data = await tmdbFetch<{ results: Array<{ id: number; media_type: string; title?: string; name?: string; overview: string; poster_path: string | null; backdrop_path: string | null; vote_average: number; release_date?: string; first_air_date?: string }> }>('/search/multi', { query, page: '1' })
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
    }))
}

export async function getContentFromDB(id: string): Promise<ContentItem | null> {
  const content = await prisma.content.findUnique({
    where: { id },
    include: { genres: { include: { genre: true } } },
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
    seasons: content.seasons ?? undefined,
    episodes: content.episodes ?? undefined,
    maturityRating: content.maturityRating,
    trailerKey: content.trailerKey ?? undefined,
    isFeatured: content.isFeatured,
  }
}
