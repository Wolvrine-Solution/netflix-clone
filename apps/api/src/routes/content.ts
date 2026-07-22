import { Router } from 'express'
import { prisma } from '@netflix/db'
import { getContentFromDB } from '../services/tmdbService'
import { AppError } from '../middleware/errorHandler'
import { optionalAuth } from '../middleware/optionalAuth'
import { resolveKidProfile, KidFilterRequest } from '../middleware/kidFilter'
import { filterByKidProfile, maturityWhereForKids } from '../lib/maturity'

export const contentRouter = Router()

contentRouter.use(optionalAuth)
contentRouter.use(resolveKidProfile)

contentRouter.get('/', async (req: KidFilterRequest, res, next) => {
  try {
    const { mediaType, genre, page = '1', limit = '20' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = {
      status: 'PUBLISHED' as const,
      ...(mediaType ? { mediaType: mediaType as 'movie' | 'tv' } : {}),
      ...(genre
        ? {
            genres: {
              some: { genre: { name: { contains: genre, mode: 'insensitive' as const } } },
            },
          }
        : {}),
      ...(req.isKidProfile ? maturityWhereForKids() : {}),
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
    res.json({
      data: items,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalResults: total,
    })
  } catch (err) {
    next(err)
  }
})

contentRouter.get('/featured', async (req: KidFilterRequest, res, next) => {
  try {
    const content = await prisma.content.findFirst({
      where: {
        isFeatured: true,
        status: 'PUBLISHED',
        ...(req.isKidProfile ? maturityWhereForKids() : {}),
      },
      include: { genres: { include: { genre: true } } },
    })
    res.json({ data: content })
  } catch (err) {
    next(err)
  }
})

contentRouter.get('/:id', async (req: KidFilterRequest, res, next) => {
  try {
    const content = await getContentFromDB(req.params['id'] ?? '')
    if (!content) throw new AppError(404, 'Content not found')
    if (req.isKidProfile) {
      const [filtered] = filterByKidProfile([content], true)
      if (!filtered) throw new AppError(403, 'Content not available for kid profiles')
      return res.json({ data: filtered })
    }
    res.json({ data: content })
  } catch (err) {
    next(err)
  }
})
