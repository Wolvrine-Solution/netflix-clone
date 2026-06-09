export type MediaType = 'movie' | 'tv'
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type VideoQuality = 'AUTO' | 'Q_4K' | 'Q_1080P' | 'Q_720P' | 'Q_480P' | 'Q_360P'

export interface Genre {
  id: number
  name: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  isActive: boolean
  order: number
}

export interface VideoFile {
  id: string
  quality: VideoQuality
  url: string
  size?: number
  duration?: number
  format?: string
  isDefault: boolean
}

export interface Episode {
  id: string
  seasonId: string
  episodeNumber: number
  title: string
  description?: string
  stillPath?: string
  runtime?: number
  airDate?: string
  videoUrl?: string
  videoFiles: VideoFile[]
}

export interface Season {
  id: string
  contentId: string
  seasonNumber: number
  title?: string
  description?: string
  posterPath?: string
  airDate?: string
  episodes: Episode[]
}

export interface ContentItem {
  id: string
  tmdbId?: number
  title: string
  description: string
  posterPath: string
  backdropPath: string
  releaseDate: string
  rating: number
  mediaType: MediaType
  genres: Genre[]
  categories?: Category[]
  runtime?: number
  seasons?: number
  episodes?: number
  maturityRating: string
  trailerKey?: string
  videoUrl?: string
  isFeatured: boolean
  status: ContentStatus
  language: string
  country?: string
  studio?: string
  director?: string
  tagline?: string
  cast: string[]
  contentSeasons?: Season[]
  videoFiles?: VideoFile[]
}

export interface Review {
  id: string
  profileId: string
  contentId: string
  rating: number
  comment?: string
  createdAt: string
  profile?: { name: string; avatarUrl: string }
}
