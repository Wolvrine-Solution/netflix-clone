import { Inject, Injectable } from '@nestjs/common'
import {
  and,
  content,
  contentGenre,
  count,
  episode,
  eq,
  genre,
  ilike,
  season,
  videoFile,
  type Database,
  type SQL,
} from '@netflix/db'
import { AppError } from '../../../common/app-error'
import { DB, ENV } from '../../../common/tokens'
import type { Env } from '../../../config/env'
import { mapContent } from '../../../lib/contentMapper'
import { notFound, pgErrorCode } from '../admin-utils'
import type {
  CreateContent,
  EpisodeInput,
  SeasonInput,
  UpdateContent,
  VideoInput,
} from './admin-content.schemas'

const MEDIA_TYPES = ['movie', 'tv'] as const
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
type Status = (typeof STATUSES)[number]

const withBigintSize = <T extends { size: bigint | null }>(v: T) => ({
  ...v,
  size: v.size == null ? null : Number(v.size),
})

@Injectable()
export class AdminContentService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(ENV) private readonly env: Env
  ) {}

  private where(c: typeof content, f: { q: string; mediaType?: string; status?: string }) {
    const conds: (SQL | undefined)[] = [
      f.q ? ilike(c.title, `%${f.q}%`) : undefined,
      f.mediaType && (MEDIA_TYPES as readonly string[]).includes(f.mediaType)
        ? eq(c.mediaType, f.mediaType as 'movie' | 'tv')
        : undefined,
      f.status ? eq(c.status, f.status as Status) : undefined,
    ]
    return and(...conds)
  }

  async list(f: { q: string; mediaType?: string; status?: string; page: number; limit: number }) {
    if (f.status && !(STATUSES as readonly string[]).includes(f.status)) {
      throw new AppError(400, 'Invalid status filter')
    }
    const [items, [totals]] = await Promise.all([
      this.db.query.content.findMany({
        where: (c) => this.where(c as unknown as typeof content, f),
        limit: f.limit,
        offset: (f.page - 1) * f.limit,
        orderBy: (c, { desc: d }) => d(c.createdAt),
        with: {
          genres: { with: { genre: true } },
          videoFiles: { columns: { id: true, quality: true, url: true, isDefault: true } },
        },
      }),
      this.db.select({ total: count() }).from(content).where(this.where(content, f)),
    ])
    const total = totals?.total ?? 0
    return {
      data: items.map(mapContent),
      page: f.page,
      totalPages: Math.ceil(total / f.limit),
      totalResults: total,
    }
  }

  private async withGenres(id: string) {
    const c = await this.db.query.content.findFirst({
      where: eq(content.id, id),
      with: { genres: { with: { genre: true } } },
    })
    if (!c) notFound('Content')
    return c
  }

  async create(input: CreateContent) {
    const { genreIds, ...data } = input
    const id = await this.db.transaction(async (tx) => {
      const [created] = await tx.insert(content).values(data).returning({ id: content.id })
      if (genreIds.length) {
        // Unknown genre ids are created on the fly (as connectOrCreate did).
        await tx
          .insert(genre)
          .values(genreIds.map((gid) => ({ id: gid, name: `Genre ${gid}` })))
          .onConflictDoNothing()
        await tx
          .insert(contentGenre)
          .values([...new Set(genreIds)].map((genreId) => ({ contentId: created!.id, genreId })))
      }
      return created!.id
    })
    return this.withGenres(id)
  }

  async findByTmdbId(tmdbId: number) {
    const [existing] = await this.db.select().from(content).where(eq(content.tmdbId, tmdbId))
    return existing
  }

  async importFromTmdb(tmdbId: number, mediaType: 'movie' | 'tv') {
    const key = this.env.TMDB_API_KEY ?? ''
    const endpoint = `${this.env.TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${key}&append_to_response=videos,credits`
    const tmdbRes = await fetch(endpoint)
    if (!tmdbRes.ok) throw new AppError(502, 'TMDB fetch failed')
    const tmdb = (await tmdbRes.json()) as Record<string, unknown>

    const trailer = (
      tmdb['videos'] as {
        results?: Array<{ site: string; type: string; key: string; official?: boolean }>
      }
    )?.results
      ?.filter((v) => v.site === 'YouTube' && v.type === 'Trailer')
      ?.sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0))[0]?.key

    const genres = (tmdb['genres'] as Array<{ id: number; name: string }>) ?? []
    const isMovie = mediaType === 'movie'

    const id = await this.db.transaction(async (tx) => {
      for (const g of genres) {
        await tx
          .insert(genre)
          .values({ id: g.id, name: g.name })
          .onConflictDoUpdate({ target: genre.id, set: { name: g.name } })
      }
      const [created] = await tx
        .insert(content)
        .values({
          tmdbId,
          mediaType,
          title: (isMovie ? tmdb['title'] : tmdb['name']) as string,
          description: (tmdb['overview'] as string) || '',
          posterPath: tmdb['poster_path']
            ? `https://image.tmdb.org/t/p/w500${tmdb['poster_path']}`
            : '',
          backdropPath: tmdb['backdrop_path']
            ? `https://image.tmdb.org/t/p/w1280${tmdb['backdrop_path']}`
            : '',
          releaseDate: (isMovie ? tmdb['release_date'] : (tmdb['first_air_date'] ?? '')) as string,
          rating: (tmdb['vote_average'] as number) / 10,
          runtime: isMovie ? (tmdb['runtime'] as number) || undefined : undefined,
          seasons: !isMovie ? (tmdb['number_of_seasons'] as number) || undefined : undefined,
          episodes: !isMovie ? (tmdb['number_of_episodes'] as number) || undefined : undefined,
          trailerKey: trailer,
          maturityRating: 'TV-MA',
          isFeatured: false,
          status: 'PUBLISHED',
          cast:
            (tmdb['credits'] as { cast?: Array<{ name: string }> })?.cast
              ?.slice(0, 10)
              .map((c) => c.name) ?? [],
          director: (
            tmdb['credits'] as { crew?: Array<{ job: string; name: string }> }
          )?.crew?.find((c) => c.job === 'Director')?.name,
        })
        .returning({ id: content.id })
      if (genres.length) {
        await tx
          .insert(contentGenre)
          .values(genres.map((g) => ({ contentId: created!.id, genreId: g.id })))
      }
      return created!.id
    })
    return this.withGenres(id)
  }

  async tmdbSearch(q: string) {
    const url = `${this.env.TMDB_BASE_URL}/search/multi?api_key=${this.env.TMDB_API_KEY ?? ''}&query=${encodeURIComponent(q)}&include_adult=false`
    const r = await fetch(url)
    const data = (await r.json()) as { results?: unknown[] }
    return (data.results ?? []).filter(
      (i) =>
        (i as { media_type: string }).media_type === 'movie' ||
        (i as { media_type: string }).media_type === 'tv'
    )
  }

  /** Raw detail view for the admin editor (all columns, nested seasons/episodes/videos). */
  async detail(id: string) {
    const c = await this.db.query.content.findFirst({
      where: eq(content.id, id),
      with: {
        genres: { with: { genre: true } },
        videoFiles: true,
        contentSeasons: {
          orderBy: (s, { asc: a }) => a(s.seasonNumber),
          with: {
            episodes: {
              orderBy: (e, { asc: a }) => a(e.episodeNumber),
              with: { videoFiles: true },
            },
          },
        },
      },
    })
    if (!c) notFound('Content')
    return {
      ...c,
      videoFiles: c.videoFiles.map(withBigintSize),
      contentSeasons: c.contentSeasons.map((s) => ({
        ...s,
        episodes: s.episodes.map((e) => ({ ...e, videoFiles: e.videoFiles.map(withBigintSize) })),
      })),
    }
  }

  async update(id: string, input: UpdateContent) {
    const { genreIds, ...data } = input
    const [existing] = await this.db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.id, id))
    if (!existing) notFound('Content')

    await this.db.transaction(async (tx) => {
      await tx
        .update(content)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(content.id, id))
      if (genreIds !== undefined) {
        await tx.delete(contentGenre).where(eq(contentGenre.contentId, id))
        if (genreIds.length) {
          await tx
            .insert(contentGenre)
            .values([...new Set(genreIds)].map((genreId) => ({ contentId: id, genreId })))
        }
      }
    })
    return this.withGenres(id)
  }

  async remove(id: string): Promise<{ title: string }> {
    const [existing] = await this.db
      .select({ title: content.title })
      .from(content)
      .where(eq(content.id, id))
    if (!existing) notFound('Content')
    await this.db.delete(content).where(eq(content.id, id))
    return existing
  }

  async setFeatured(id: string, isFeatured: boolean) {
    return this.db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: content.id }).from(content).where(eq(content.id, id))
      if (!existing) notFound('Content')
      if (isFeatured) {
        await tx.update(content).set({ isFeatured: false }).where(eq(content.isFeatured, true))
      }
      const [updated] = await tx
        .update(content)
        .set({ isFeatured, updatedAt: new Date() })
        .where(eq(content.id, id))
        .returning()
      return updated!
    })
  }

  private async assertContent(id: string) {
    const [c] = await this.db.select({ id: content.id }).from(content).where(eq(content.id, id))
    if (!c) notFound('Content')
  }

  async addVideo(contentId: string, data: VideoInput) {
    await this.assertContent(contentId)
    return this.db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(videoFile)
          .set({ isDefault: false })
          .where(eq(videoFile.contentId, contentId))
      }
      const [vf] = await tx
        .insert(videoFile)
        .values({ contentId, ...data })
        .returning()
      return withBigintSize(vf!)
    })
  }

  async removeVideo(videoId: string) {
    const deleted = await this.db
      .delete(videoFile)
      .where(eq(videoFile.id, videoId))
      .returning({ id: videoFile.id })
    if (!deleted.length) notFound('Video file')
  }

  async addSeason(contentId: string, data: SeasonInput) {
    await this.assertContent(contentId)
    try {
      const [s] = await this.db
        .insert(season)
        .values({ contentId, ...data })
        .returning()
      return s!
    } catch (err) {
      if (pgErrorCode(err) === '23505') throw new AppError(409, 'Season already exists')
      throw err
    }
  }

  async addEpisode(seasonId: string, data: EpisodeInput) {
    const [s] = await this.db.select({ id: season.id }).from(season).where(eq(season.id, seasonId))
    if (!s) notFound('Season')
    try {
      const [e] = await this.db
        .insert(episode)
        .values({ seasonId, ...data })
        .returning()
      return e!
    } catch (err) {
      if (pgErrorCode(err) === '23505') throw new AppError(409, 'Episode already exists')
      throw err
    }
  }

  async updateEpisode(episodeId: string, data: Partial<EpisodeInput>) {
    const [e] = await this.db.update(episode).set(data).where(eq(episode.id, episodeId)).returning()
    if (!e) notFound('Episode')
    return e
  }

  async removeEpisode(episodeId: string) {
    const deleted = await this.db
      .delete(episode)
      .where(eq(episode.id, episodeId))
      .returning({ id: episode.id })
    if (!deleted.length) notFound('Episode')
  }
}
