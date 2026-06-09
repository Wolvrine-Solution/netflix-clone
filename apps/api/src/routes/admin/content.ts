import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'
import { AppError } from '../../middleware/errorHandler'
import { mapContent } from '../../lib/contentMapper'

export const adminContentRouter = Router()
adminContentRouter.use(authenticate, adminOnly)

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = process.env['TMDB_API_KEY'] ?? ''

const createSchema = z.object({
  title: z.string().min(1),
  mediaType: z.enum(['movie', 'tv']),
  description: z.string().min(1),
  posterPath: z.string().min(1),
  backdropPath: z.string().min(1),
  releaseDate: z.string().min(1),
  rating: z.number().min(0).max(10),
  runtime: z.number().int().positive().optional(),
  seasons: z.number().int().positive().optional(),
  episodes: z.number().int().positive().optional(),
  maturityRating: z.string().default('TV-MA'),
  trailerKey: z.string().optional(),
  videoUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  language: z.string().default('en'),
  country: z.string().optional(),
  studio: z.string().optional(),
  director: z.string().optional(),
  tagline: z.string().optional(),
  cast: z.array(z.string()).default([]),
  genreIds: z.array(z.number()).default([]),
  tmdbId: z.number().optional(),
})

const updateSchema = createSchema.partial()

const importSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(['movie', 'tv']),
})

// ── List ──────────────────────────────────────────────────────────────────────
adminContentRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(String(req.query['page'] ?? '1')))
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query['limit'] ?? '20'))))
    const q = String(req.query['q'] ?? '').trim()
    const mediaType = req.query['mediaType'] as string | undefined
    const status = req.query['status'] as string | undefined

    const where = {
      ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
      ...(mediaType && ['movie', 'tv'].includes(mediaType) ? { mediaType: mediaType as 'movie' | 'tv' } : {}),
      ...(status ? { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          videoFiles: { select: { id: true, quality: true, url: true, isDefault: true } },
        },
      }),
      prisma.content.count({ where }),
    ])

    res.json({ data: items.map(mapContent), page, totalPages: Math.ceil(total / limit), totalResults: total })
  } catch (err) { next(err) }
})

// ── Create ────────────────────────────────────────────────────────────────────
adminContentRouter.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { genreIds, ...data } = req.body as z.infer<typeof createSchema>

    const content = await prisma.content.create({
      data: {
        ...data,
        genres: genreIds?.length
          ? { create: genreIds.map((id: number) => ({ genre: { connectOrCreate: { where: { id }, create: { id, name: '' } } } })) }
          : undefined,
      },
      include: { genres: { include: { genre: true } } },
    })

    await logAdmin(req, 'CREATE', 'Content', content.id, { title: content.title })
    res.status(201).json({ data: mapContent(content) })
  } catch (err) { next(err) }
})

// ── Import from TMDB ──────────────────────────────────────────────────────────
adminContentRouter.post('/import', validate(importSchema), async (req, res, next) => {
  try {
    const { tmdbId, mediaType } = req.body as z.infer<typeof importSchema>

    const existing = await prisma.content.findUnique({ where: { tmdbId } })
    if (existing) return res.json({ data: mapContent({ ...existing, genres: [] }), message: 'Already imported' })

    const endpoint = mediaType === 'movie'
      ? `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=videos,credits`
      : `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=videos,credits`

    const tmdbRes = await fetch(endpoint)
    if (!tmdbRes.ok) throw new AppError(502, 'TMDB fetch failed')
    const tmdb = await tmdbRes.json() as Record<string, unknown>

    const trailer = (tmdb['videos'] as { results?: Array<{ site: string; type: string; key: string; official?: boolean }> })?.results
      ?.filter((v) => v.site === 'YouTube' && v.type === 'Trailer')
      ?.sort((a, b) => (b.official ? 1 : 0) - (a.official ? 1 : 0))[0]?.key

    const genres = (tmdb['genres'] as Array<{ id: number; name: string }> ?? [])

    // Upsert genres
    await Promise.all(genres.map((g) =>
      prisma.genre.upsert({ where: { id: g.id }, update: { name: g.name }, create: { id: g.id, name: g.name } })
    ))

    const isMovie = mediaType === 'movie'
    const content = await prisma.content.create({
      data: {
        tmdbId,
        mediaType,
        title: (isMovie ? tmdb['title'] : tmdb['name']) as string,
        description: (tmdb['overview'] as string) || '',
        posterPath: tmdb['poster_path'] ? `https://image.tmdb.org/t/p/w500${tmdb['poster_path']}` : '',
        backdropPath: tmdb['backdrop_path'] ? `https://image.tmdb.org/t/p/w1280${tmdb['backdrop_path']}` : '',
        releaseDate: (isMovie ? tmdb['release_date'] : tmdb['first_air_date'] ?? '') as string,
        rating: (tmdb['vote_average'] as number) / 10,
        runtime: isMovie ? ((tmdb['runtime'] as number) || undefined) : undefined,
        seasons: !isMovie ? ((tmdb['number_of_seasons'] as number) || undefined) : undefined,
        episodes: !isMovie ? ((tmdb['number_of_episodes'] as number) || undefined) : undefined,
        trailerKey: trailer,
        maturityRating: 'TV-MA',
        isFeatured: false,
        status: 'PUBLISHED',
        cast: ((tmdb['credits'] as { cast?: Array<{ name: string }> })?.cast?.slice(0, 10).map((c) => c.name) ?? []),
        director: ((tmdb['credits'] as { crew?: Array<{ job: string; name: string }> })?.crew?.find((c) => c.job === 'Director')?.name),
        genres: { create: genres.map((g) => ({ genreId: g.id })) },
      },
      include: { genres: { include: { genre: true } } },
    })

    await logAdmin(req, 'IMPORT', 'Content', content.id, { tmdbId, title: content.title })
    res.status(201).json({ data: mapContent(content) })
  } catch (err) { next(err) }
})

// ── TMDB Search proxy ─────────────────────────────────────────────────────────
adminContentRouter.get('/tmdb-search', async (req, res, next) => {
  try {
    const q = String(req.query['q'] ?? '').trim()
    if (!q) return res.json({ results: [] })
    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}&include_adult=false`
    const r = await fetch(url)
    const data = await r.json() as { results?: unknown[] }
    res.json({ results: (data.results ?? []).filter((i: unknown) => (i as { media_type: string }).media_type === 'movie' || (i as { media_type: string }).media_type === 'tv') })
  } catch (err) { next(err) }
})

// ── Get single ────────────────────────────────────────────────────────────────
adminContentRouter.get('/:id', async (req, res, next) => {
  try {
    const content = await prisma.content.findUnique({
      where: { id: req.params['id'] },
      include: {
        genres: { include: { genre: true } },
        videoFiles: true,
        contentSeasons: { include: { episodes: { include: { videoFiles: true }, orderBy: { episodeNumber: 'asc' } } }, orderBy: { seasonNumber: 'asc' } },
      },
    })
    if (!content) throw new AppError(404, 'Content not found')
    res.json({ data: content })
  } catch (err) { next(err) }
})

// ── Update ────────────────────────────────────────────────────────────────────
adminContentRouter.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { genreIds, ...data } = req.body as z.infer<typeof updateSchema>
    const id = req.params['id']!

    const existing = await prisma.content.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Content not found')

    const content = await prisma.content.update({
      where: { id },
      data: {
        ...data,
        ...(genreIds !== undefined ? {
          genres: {
            deleteMany: {},
            create: genreIds.map((gId: number) => ({ genreId: gId })),
          },
        } : {}),
      },
      include: { genres: { include: { genre: true } } },
    })

    await logAdmin(req, 'UPDATE', 'Content', id, { fields: Object.keys(data) })
    res.json({ data: mapContent(content) })
  } catch (err) { next(err) }
})

// ── Delete ────────────────────────────────────────────────────────────────────
adminContentRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params['id']!
    const existing = await prisma.content.findUnique({ where: { id }, select: { title: true } })
    if (!existing) throw new AppError(404, 'Content not found')

    await prisma.content.delete({ where: { id } })
    await logAdmin(req, 'DELETE', 'Content', id, { title: existing.title })
    res.json({ message: 'Content deleted' })
  } catch (err) { next(err) }
})

// ── Toggle featured ───────────────────────────────────────────────────────────
adminContentRouter.patch('/:id/featured', async (req, res, next) => {
  try {
    const id = req.params['id']!
    const { isFeatured } = req.body as { isFeatured: boolean }

    if (isFeatured) {
      await prisma.content.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } })
    }
    const content = await prisma.content.update({ where: { id }, data: { isFeatured } })
    await logAdmin(req, 'SET_FEATURED', 'Content', id, { isFeatured })
    res.json({ data: content })
  } catch (err) { next(err) }
})

// ── Video file CRUD ───────────────────────────────────────────────────────────
const videoSchema = z.object({
  quality: z.enum(['AUTO', 'Q_4K', 'Q_1080P', 'Q_720P', 'Q_480P', 'Q_360P']).default('AUTO'),
  url: z.string().url(),
  format: z.string().optional(),
  isDefault: z.boolean().default(false),
})

adminContentRouter.post('/:id/videos', validate(videoSchema), async (req, res, next) => {
  try {
    const contentId = req.params['id']!
    const data = req.body as z.infer<typeof videoSchema>

    if (data.isDefault) {
      await prisma.videoFile.updateMany({ where: { contentId }, data: { isDefault: false } })
    }
    const vf = await prisma.videoFile.create({ data: { contentId, ...data } })
    res.status(201).json({ data: vf })
  } catch (err) { next(err) }
})

adminContentRouter.delete('/:id/videos/:videoId', async (req, res, next) => {
  try {
    await prisma.videoFile.delete({ where: { id: req.params['videoId'] } })
    res.json({ message: 'Video file removed' })
  } catch (err) { next(err) }
})

// ── Seasons & Episodes ────────────────────────────────────────────────────────
const seasonSchema = z.object({
  seasonNumber: z.number().int().positive(),
  title: z.string().optional(),
  description: z.string().optional(),
  posterPath: z.string().optional(),
  airDate: z.string().optional(),
})

adminContentRouter.post('/:id/seasons', validate(seasonSchema), async (req, res, next) => {
  try {
    const contentId = req.params['id']!
    const data = req.body as z.infer<typeof seasonSchema>
    const season = await prisma.season.create({ data: { contentId, ...data } })
    res.status(201).json({ data: season })
  } catch (err) { next(err) }
})

const episodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  stillPath: z.string().optional(),
  runtime: z.number().int().positive().optional(),
  airDate: z.string().optional(),
  videoUrl: z.string().url().optional(),
})

adminContentRouter.post('/:id/seasons/:seasonId/episodes', validate(episodeSchema), async (req, res, next) => {
  try {
    const seasonId = req.params['seasonId']!
    const data = req.body as z.infer<typeof episodeSchema>
    const episode = await prisma.episode.create({ data: { seasonId, ...data } })
    res.status(201).json({ data: episode })
  } catch (err) { next(err) }
})

adminContentRouter.put('/:id/seasons/:seasonId/episodes/:episodeId', validate(episodeSchema.partial()), async (req, res, next) => {
  try {
    const episode = await prisma.episode.update({
      where: { id: req.params['episodeId'] },
      data: req.body as Record<string, unknown>,
    })
    res.json({ data: episode })
  } catch (err) { next(err) }
})

adminContentRouter.delete('/:id/seasons/:seasonId/episodes/:episodeId', async (req, res, next) => {
  try {
    await prisma.episode.delete({ where: { id: req.params['episodeId'] } })
    res.json({ message: 'Episode deleted' })
  } catch (err) { next(err) }
})

// ─── helpers ──────────────────────────────────────────────────────────────────
import { AuthRequest } from '../../middleware/authenticate'

async function logAdmin(req: AuthRequest, action: string, resource: string, resourceId?: string, details?: Record<string, unknown>) {
  if (!req.userId) return
  await prisma.adminLog.create({
    data: { adminId: req.userId, action, resource, resourceId, details, ipAddress: String(req.ip ?? '') },
  }).catch(() => {/* audit log failure should not break the request */})
}
