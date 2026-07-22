import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'

export const adminGenresRouter = Router()
adminGenresRouter.use(authenticate, adminOnly)

adminGenresRouter.get('/', async (_req, res, next) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { contents: true } } },
    })
    res.json({ data: genres })
  } catch (err) {
    next(err)
  }
})

const genreSchema = z.object({ id: z.number().int().positive(), name: z.string().min(1) })

adminGenresRouter.post('/', validate(genreSchema), async (req, res, next) => {
  try {
    const genre = await prisma.genre.upsert({
      where: { id: (req.body as { id: number }).id },
      update: { name: (req.body as { name: string }).name },
      create: req.body as { id: number; name: string },
    })
    res.status(201).json({ data: genre })
  } catch (err) {
    next(err)
  }
})

adminGenresRouter.put('/:id', async (req, res, next) => {
  try {
    const genre = await prisma.genre.update({
      where: { id: parseInt(req.params['id']!) },
      data: { name: (req.body as { name: string }).name },
    })
    res.json({ data: genre })
  } catch (err) {
    next(err)
  }
})

adminGenresRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.genre.delete({ where: { id: parseInt(req.params['id']!) } })
    res.json({ message: 'Genre deleted' })
  } catch (err) {
    next(err)
  }
})
