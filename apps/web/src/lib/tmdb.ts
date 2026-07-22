import type { ContentItem } from '@netflix/types'
import type { TMDBMovieDetails, TMDBTVDetails } from '@netflix/types'

const BASE = process.env['TMDB_BASE_URL'] ?? 'https://api.themoviedb.org/3'
const KEY = process.env['TMDB_API_KEY'] ?? ''
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('language', 'en-US')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.statusText}`)
  return res.json() as Promise<T>
}

export function imageUrl(
  path: string | null,
  size: 'w300' | 'w500' | 'w780' | 'original' = 'w500'
) {
  if (!path) return '/placeholder.jpg'
  return `${IMAGE_BASE}/${size}${path}`
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
  return tmdbFetch<TMDBMovieDetails>(`/movie/${tmdbId}`, { append_to_response: 'videos,credits' })
}

export async function getTVDetails(tmdbId: number): Promise<TMDBTVDetails> {
  return tmdbFetch<TMDBTVDetails>(`/tv/${tmdbId}`, { append_to_response: 'videos,credits' })
}

export function getTrailerKey(
  videos: Array<{ type: string; site: string; key: string; official: boolean }>
): string | null {
  const trailers = videos
    .filter((v) => v.type === 'Trailer' && v.site === 'YouTube')
    .sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0))
  return trailers[0]?.key ?? null
}

export function mapMovieToContentItem(movie: TMDBMovieDetails): ContentItem {
  return {
    id: String(movie.id),
    tmdbId: movie.id,
    title: movie.title,
    description: movie.overview,
    posterPath: imageUrl(movie.poster_path),
    backdropPath: imageUrl(movie.backdrop_path, 'original'),
    releaseDate: movie.release_date,
    rating: movie.vote_average,
    mediaType: 'movie',
    genres: movie.genres,
    runtime: movie.runtime,
    maturityRating: 'R',
    trailerKey: movie.videos ? (getTrailerKey(movie.videos.results) ?? undefined) : undefined,
    isFeatured: false,
    status: 'PUBLISHED',
    language: 'en',
    cast: movie.credits?.cast?.slice(0, 10).map((c) => c.name) ?? [],
  }
}
