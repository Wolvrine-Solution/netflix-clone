import { z } from 'zod'

// NOTE (Zod 4): `.partial()` over fields that carry `.default()` re-applies the default when the
// key is absent, which would silently reset columns on PUT. The update schema is therefore built
// from `base` (no defaults); only `createSchema` adds defaults.
const base = z.object({
  title: z.string().min(1),
  mediaType: z.enum(['movie', 'tv']),
  description: z.string().min(1),
  posterPath: z.string().min(1),
  backdropPath: z.string().min(1),
  releaseDate: z.string().min(1),
  rating: z.number().min(0).max(10),
  runtime: z.number().int().positive(),
  seasons: z.number().int().positive(),
  episodes: z.number().int().positive(),
  maturityRating: z.string(),
  trailerKey: z.string(),
  videoUrl: z.string().url(),
  isFeatured: z.boolean(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  language: z.string(),
  country: z.string(),
  studio: z.string(),
  director: z.string(),
  tagline: z.string(),
  cast: z.array(z.string()),
  genreIds: z.array(z.number()),
  tmdbId: z.number(),
})

export const createContentSchema = base
  .partial()
  .required({
    title: true,
    mediaType: true,
    description: true,
    posterPath: true,
    backdropPath: true,
    releaseDate: true,
    rating: true,
  })
  .extend({
    maturityRating: z.string().default('TV-MA'),
    isFeatured: z.boolean().default(false),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
    language: z.string().default('en'),
    cast: z.array(z.string()).default([]),
    genreIds: z.array(z.number()).default([]),
  })

export const updateContentSchema = base.partial()

export const importSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
})

export const videoSchema = z.object({
  quality: z.enum(['AUTO', 'Q_4K', 'Q_1080P', 'Q_720P', 'Q_480P', 'Q_360P']).default('AUTO'),
  url: z.string().url(),
  format: z.string().optional(),
  isDefault: z.boolean().default(false),
})

export const seasonSchema = z.object({
  seasonNumber: z.number().int().positive(),
  title: z.string().optional(),
  description: z.string().optional(),
  posterPath: z.string().optional(),
  airDate: z.string().optional(),
})

export const episodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  stillPath: z.string().optional(),
  runtime: z.number().int().positive().optional(),
  airDate: z.string().optional(),
  videoUrl: z.string().url().optional(),
})
export const updateEpisodeSchema = episodeSchema.partial()

export type CreateContent = z.infer<typeof createContentSchema>
export type UpdateContent = z.infer<typeof updateContentSchema>
export type VideoInput = z.infer<typeof videoSchema>
export type SeasonInput = z.infer<typeof seasonSchema>
export type EpisodeInput = z.infer<typeof episodeSchema>
