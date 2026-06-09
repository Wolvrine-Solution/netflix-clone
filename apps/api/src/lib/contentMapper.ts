import type { ContentItem } from '@netflix/types'

type PrismaContent = {
  id: string
  tmdbId: number | null
  mediaType: string
  title: string
  description: string
  posterPath: string
  backdropPath: string
  trailerKey: string | null
  videoUrl: string | null
  releaseDate: string
  rating: number
  runtime: number | null
  seasons: number | null
  episodes: number | null
  maturityRating: string
  isFeatured: boolean
  status: string
  language: string
  country: string | null
  studio: string | null
  director: string | null
  tagline: string | null
  cast: string[]
  genres: Array<{ genre: { id: number; name: string } }>
}

export function mapContent(c: PrismaContent): ContentItem {
  return {
    id: c.id,
    tmdbId: c.tmdbId ?? undefined,
    title: c.title,
    description: c.description,
    posterPath: c.posterPath,
    backdropPath: c.backdropPath,
    releaseDate: c.releaseDate,
    rating: c.rating,
    mediaType: c.mediaType as 'movie' | 'tv',
    maturityRating: c.maturityRating,
    trailerKey: c.trailerKey ?? undefined,
    videoUrl: c.videoUrl ?? undefined,
    isFeatured: c.isFeatured,
    status: c.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    language: c.language,
    country: c.country ?? undefined,
    studio: c.studio ?? undefined,
    director: c.director ?? undefined,
    tagline: c.tagline ?? undefined,
    cast: c.cast,
    genres: c.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
    runtime: c.runtime ?? undefined,
    seasons: c.seasons ?? undefined,
    episodes: c.episodes ?? undefined,
  }
}
