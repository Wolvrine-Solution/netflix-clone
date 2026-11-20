import { Inject, Injectable } from '@nestjs/common'
import type { ContentItem, ContentStatus } from '@netflix/types'
import { REDIS, ENV } from '../../common/tokens'
import type { Env } from '../../config/env'
import type { getRedis } from '../../lib/redis'

type Redis = Awaited<ReturnType<typeof getRedis>>

interface TmdbSearchResult {
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
}

/** TMDB client with a 1h Redis (or in-memory) cache. */
@Injectable()
export class TmdbService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(REDIS) private readonly redis: Redis
  ) {}

  private async fetchJson<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const cacheKey = `tmdb:${path}:${JSON.stringify(params)}`
    const cached = await this.redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as T

    const url = new URL(`${this.env.TMDB_BASE_URL}${path}`)
    url.searchParams.set('api_key', this.env.TMDB_API_KEY ?? '')
    url.searchParams.set('language', 'en-US')
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`TMDB error: ${res.statusText}`)
    const data = (await res.json()) as T
    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 3600)
    return data
  }

  async search(query: string): Promise<ContentItem[]> {
    if (!this.env.TMDB_API_KEY) return []
    const data = await this.fetchJson<{ results: TmdbSearchResult[] }>('/search/multi', {
      query,
      page: '1',
    })
    return data.results
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 20)
      .map((r) => ({
        id: String(r.id),
        tmdbId: r.id,
        title: r.title ?? r.name ?? 'Unknown',
        description: r.overview,
        posterPath: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : '',
        backdropPath: r.backdrop_path
          ? `https://image.tmdb.org/t/p/original${r.backdrop_path}`
          : '',
        releaseDate: r.release_date ?? r.first_air_date ?? '',
        rating: r.vote_average,
        mediaType: r.media_type as 'movie' | 'tv',
        genres: [],
        maturityRating: 'TV-MA',
        isFeatured: false,
        status: 'PUBLISHED' as ContentStatus,
        language: 'en',
        cast: [],
      }))
  }
}
