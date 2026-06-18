import { Router } from 'express'
import { prisma } from '@netflix/db'

export const rowsRouter = Router()

rowsRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.row.findMany({
      orderBy: { order: 'asc' },
      include: {
        contents: {
          orderBy: { order: 'asc' },
          take: 20,
          include: {
            content: {
              include: { genres: { include: { genre: true } } },
            },
          },
        },
      },
    })
    const data = rows.map((row) => ({
      id: row.id,
      title: row.title,
      items: row.contents.map((cr) => ({
        id: cr.content.id,
        tmdbId: cr.content.tmdbId ?? undefined,
        title: cr.content.title,
        description: cr.content.description,
        posterPath: cr.content.posterPath,
        backdropPath: cr.content.backdropPath,
        releaseDate: cr.content.releaseDate,
        rating: cr.content.rating,
        mediaType: cr.content.mediaType,
        genres: cr.content.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
        runtime: cr.content.runtime ?? undefined,
        seasons: cr.content.seasons ?? undefined,
        maturityRating: cr.content.maturityRating,
        trailerKey: cr.content.trailerKey ?? undefined,
        isFeatured: cr.content.isFeatured,
        status: cr.content.status,
        language: cr.content.language,
        cast: cr.content.cast,
      })),
    }))
    res.json({ data })
  } catch (err) {
    next(err)
  }
})
