import { Inject, Injectable } from '@nestjs/common'
import type { ContentItem, ContentStatus, VideoFile as VideoFileDto } from '@netflix/types'
import {
  and,
  content,
  count,
  desc,
  eq,
  exists,
  genre,
  contentGenre,
  ilike,
  type Database,
} from '@netflix/db'
import { kidsMaturityCondition } from '../../common/maturity'
import { DB } from '../../common/tokens'

type VideoFileRow = {
  id: string
  quality: VideoFileDto['quality']
  url: string
  size: bigint | null
  duration: number | null
  format: string | null
  isDefault: boolean
}

export function toVideoFileDto(v: VideoFileRow): VideoFileDto {
  return {
    id: v.id,
    quality: v.quality,
    url: v.url,
    size: v.size == null ? undefined : Number(v.size),
    duration: v.duration ?? undefined,
    format: v.format ?? undefined,
    isDefault: v.isDefault,
  }
}

export interface ListQuery {
  mediaType?: 'movie' | 'tv'
  genre?: string
  page: number
  limit: number
  kid: boolean
}

@Injectable()
export class ContentService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private listConditions(c: typeof content, q: ListQuery) {
    return and(
      eq(c.status, 'PUBLISHED'),
      q.mediaType ? eq(c.mediaType, q.mediaType) : undefined,
      q.genre
        ? exists(
            this.db
              .select({ one: contentGenre.contentId })
              .from(contentGenre)
              .innerJoin(genre, eq(genre.id, contentGenre.genreId))
              .where(and(eq(contentGenre.contentId, c.id), ilike(genre.name, `%${q.genre}%`)))
          )
        : undefined,
      q.kid ? kidsMaturityCondition(c.maturityRating) : undefined
    )
  }

  async list(q: ListQuery) {
    const [items, [totals]] = await Promise.all([
      this.db.query.content.findMany({
        where: (c) => this.listConditions(c as unknown as typeof content, q),
        with: { genres: { with: { genre: true } } },
        orderBy: (c, { desc: d }) => d(c.rating),
        limit: q.limit,
        offset: (q.page - 1) * q.limit,
      }),
      this.db.select({ total: count() }).from(content).where(this.listConditions(content, q)),
    ])
    return { items, total: totals?.total ?? 0 }
  }

  featured(kid: boolean) {
    return this.db.query.content.findFirst({
      where: (c) =>
        and(
          eq(c.isFeatured, true),
          eq(c.status, 'PUBLISHED'),
          kid ? kidsMaturityCondition(c.maturityRating) : undefined
        ),
      with: { genres: { with: { genre: true } } },
    })
  }

  /** Full detail view (genres, default-first video files, seasons and episodes). */
  async findById(id: string): Promise<ContentItem | null> {
    const c = await this.db.query.content.findFirst({
      where: eq(content.id, id),
      with: {
        genres: { with: { genre: true } },
        videoFiles: { orderBy: (v, { desc: d }) => d(v.isDefault) },
        contentSeasons: {
          orderBy: (s, { asc }) => asc(s.seasonNumber),
          with: {
            episodes: {
              orderBy: (e, { asc }) => asc(e.episodeNumber),
              with: { videoFiles: { orderBy: (v, { desc: d }) => d(v.isDefault) } },
            },
          },
        },
      },
    })
    if (!c) return null
    return {
      id: c.id,
      tmdbId: c.tmdbId ?? undefined,
      title: c.title,
      description: c.description,
      posterPath: c.posterPath,
      backdropPath: c.backdropPath,
      releaseDate: c.releaseDate,
      rating: c.rating,
      mediaType: c.mediaType,
      genres: c.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
      runtime: c.runtime ?? undefined,
      seasons: c.contentSeasons.length > 0 ? c.contentSeasons.length : (c.seasons ?? undefined),
      episodes: c.episodes ?? undefined,
      maturityRating: c.maturityRating,
      trailerKey: c.trailerKey ?? undefined,
      isFeatured: c.isFeatured,
      status: c.status as ContentStatus,
      language: c.language,
      country: c.country ?? undefined,
      studio: c.studio ?? undefined,
      director: c.director ?? undefined,
      tagline: c.tagline ?? undefined,
      cast: c.cast,
      videoUrl: c.videoUrl ?? undefined,
      videoFiles: c.videoFiles.map(toVideoFileDto),
      contentSeasons: c.contentSeasons.map((s) => ({
        id: s.id,
        contentId: c.id,
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
          videoFiles: e.videoFiles.map(toVideoFileDto),
        })),
      })),
    }
  }
}
