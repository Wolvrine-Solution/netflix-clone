import { Router } from 'express'
import { prisma } from '@netflix/db'
import { searchTMDB } from '../services/tmdbService'
import { searchCatalog } from '../modules/search/indexer'
import { searchLimiter } from '../middleware/rateLimiter'
import { optionalAuth } from '../middleware/optionalAuth'
import { resolveKidProfile, KidFilterRequest } from '../middleware/kidFilter'
import { filterByKidProfile, maturityWhereForKids } from '../lib/maturity'

export const searchRouter = Router()

searchRouter.use(optionalAuth)
searchRouter.use(resolveKidProfile)

searchRouter.get('/', searchLimiter, async (req: KidFilterRequest, res, next) => {
  try {
    const q = (req.query['q'] as string) ?? ''
    if (!q || q.trim().length < 2) return res.json({ data: [] })

    const isKid = !!req.isKidProfile

    const [dbResults, tmdbResults, indexedResults] = await Promise.all([
      prisma.content.findMany({
        where: {
          title: { contains: q, mode: 'insensitive' },
          status: 'PUBLISHED',
          ...(isKid ? maturityWhereForKids() : {}),
        },
        take: 10,
        include: { genres: { include: { genre: true } } },
      }),
      searchTMDB(q),
      searchCatalog(q, isKid),
    ])

    const dbIds = new Set(dbResults.map((c) => c.tmdbId))
    const mappedDb = dbResults.map((c) => ({
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
      maturityRating: c.maturityRating,
      trailerKey: c.trailerKey ?? undefined,
      isFeatured: c.isFeatured,
      status: c.status,
      language: c.language,
      cast: c.cast,
    }))

    const merged = [
      ...mappedDb,
      ...indexedResults
        .filter((r) => !dbResults.some((d) => d.id === r.id))
        .map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          posterPath: '',
          backdropPath: '',
          releaseDate: '',
          rating: 0,
          mediaType: r.mediaType as 'movie' | 'tv',
          genres: [],
          maturityRating: r.maturityRating,
          isFeatured: false,
          status: 'PUBLISHED' as const,
          language: 'en',
          cast: [] as string[],
        })),
      ...filterByKidProfile(
        tmdbResults.filter((r) => !dbIds.has(r.tmdbId)),
        isKid
      ),
    ]

    return res.json({ data: merged.slice(0, 30) })
  } catch (err) {
    return next(err)
  }
})
