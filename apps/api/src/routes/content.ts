import { Router } from 'express'
import { prisma } from '@netflix/db'
import { getContentFromDB } from '../services/tmdbService'
import { AppError } from '../middleware/errorHandler'

export const contentRouter = Router()

contentRouter.get('/', async (req, res, next) => {
  try {
    const { mediaType, genre, page = '1', limit = '20' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = {
      ...(mediaType ? { mediaType: mediaType as 'movie' | 'tv' } : {}),
      ...(genre ? { genres: { some: { genre: { name: { contains: genre, mode: 'insensitive' as const } } } } } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { genres: { include: { genre: true } } },
        orderBy: { rating: 'desc' },
      }),
      prisma.content.count({ where }),
    ])
    res.json({ data: items, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalResults: total })
  } catch (err) {
    next(err)
  }
})

contentRouter.get('/featured', async (_req, res, next) => {
  try {
    const content = await prisma.content.findFirst({
      where: { isFeatured: true },
      include: { genres: { include: { genre: true } } },
    })
    res.json({ data: content })
  } catch (err) {
    next(err)
  }
})

contentRouter.get('/:id', async (req, res, next) => {
  try {
    const content = await getContentFromDB(req.params['id'] ?? '')
    if (!content) throw new AppError(404, 'Content not found')
    res.json({ data: content })
  } catch (err) {
    next(err)
  }
})
