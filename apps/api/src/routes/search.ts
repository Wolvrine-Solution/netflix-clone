import { Router } from 'express'
import { prisma } from '@netflix/db'
import { searchTMDB } from '../services/tmdbService'
import { searchLimiter } from '../middleware/rateLimiter'

export const searchRouter = Router()

searchRouter.get('/', searchLimiter, async (req, res, next) => {
  try {
    const q = (req.query['q'] as string) ?? ''
    if (!q || q.trim().length < 2) return res.json({ data: [] })

    const [dbResults, tmdbResults] = await Promise.all([
      prisma.content.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        take: 10,
        include: { genres: { include: { genre: true } } },
      }),
      searchTMDB(q),
    ])

    const dbIds = new Set(dbResults.map((c) => c.tmdbId))
    const merged = [
      ...dbResults.map((c) => ({
        id: c.id,
        tmdbId: c.tmdbId,
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
      })),
      ...tmdbResults.filter((r) => !dbIds.has(r.tmdbId)),
    ]

    return res.json({ data: merged.slice(0, 30) })
  } catch (err) {
    return next(err)
  }
})
