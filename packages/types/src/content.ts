export type MediaType = 'movie' | 'tv'

export interface Genre {
  id: number
  name: string
}

export interface ContentItem {
  id: string
  tmdbId: number
  title: string
  description: string
  posterPath: string
  backdropPath: string
  releaseDate: string
  rating: number
  mediaType: MediaType
  genres: Genre[]
  runtime?: number
  seasons?: number
  episodes?: number
  maturityRating: string
  trailerKey?: string
  isFeatured: boolean
}

export interface Episode {
  id: string
  seasonNumber: number
  episodeNumber: number
  title: string
  description: string
  stillPath: string
  runtime: number
  airDate: string
}

export interface Season {
  seasonNumber: number
  episodeCount: number
  episodes?: Episode[]
}
