import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'
import { AppError } from '../../middleware/errorHandler'

export const adminRowsRouter = Router()
adminRowsRouter.use(authenticate, adminOnly)

const rowSchema = z.object({
  title: z.string().min(1),
  query: z.string().min(1),
  order: z.number().int().min(0).optional(),
  mediaType: z.string().optional(),
  isActive: z.boolean().default(true),
})

adminRowsRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.row.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { contents: true } } },
    })
    res.json({ data: rows.map((r) => ({ ...r, contentCount: r._count.contents })) })
  } catch (err) { next(err) }
})

adminRowsRouter.post('/', validate(rowSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof rowSchema>
    const maxOrder = await prisma.row.aggregate({ _max: { order: true } })
    const row = await prisma.row.create({
      data: { ...body, order: body.order ?? (maxOrder._max.order ?? -1) + 1 },
    })
    res.status(201).json({ data: row })
  } catch (err) { next(err) }
})

// Reorder rows in bulk — must be before /:id to avoid Express matching "reorder" as an id
// body: { rows: [{id: string, order: number}] }
adminRowsRouter.put('/reorder', async (req, res, next) => {
  try {
    const { rows } = req.body as { rows: Array<{ id: string; order: number }> }
    await Promise.all(rows.map(({ id, order }) => prisma.row.update({ where: { id }, data: { order } })))
    res.json({ message: 'Rows reordered' })
  } catch (err) { next(err) }
})

adminRowsRouter.put('/:id', validate(rowSchema.partial()), async (req, res, next) => {
  try {
    const row = await prisma.row.update({ where: { id: req.params['id'] }, data: req.body as Record<string, unknown> })
    res.json({ data: row })
  } catch (err) { next(err) }
})

adminRowsRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.row.delete({ where: { id: req.params['id'] } })
    res.json({ message: 'Row deleted' })
  } catch (err) { next(err) }
})

// Add content to row
adminRowsRouter.post('/:id/content', async (req, res, next) => {
  try {
    const { contentId } = req.body as { contentId: string }
    const rowId = req.params['id']!
    const maxOrder = await prisma.contentRow.aggregate({ where: { rowId }, _max: { order: true } })
    await prisma.contentRow.upsert({
      where: { contentId_rowId: { contentId, rowId } },
      update: {},
      create: { contentId, rowId, order: (maxOrder._max.order ?? -1) + 1 },
    })
    res.json({ message: 'Content added to row' })
  } catch (err) { next(err) }
})

// Remove content from row
adminRowsRouter.delete('/:id/content/:contentId', async (req, res, next) => {
  try {
    await prisma.contentRow.delete({
      where: { contentId_rowId: { contentId: req.params['contentId']!, rowId: req.params['id']! } },
    })
    res.json({ message: 'Content removed from row' })
  } catch (err) { next(err) }
})

// Get row contents
adminRowsRouter.get('/:id/content', async (req, res, next) => {
  try {
    const row = await prisma.row.findUnique({
      where: { id: req.params['id'] },
      include: {
        contents: {
          orderBy: { order: 'asc' },
          include: { content: { include: { genres: { include: { genre: true } } } } },
        },
      },
    })
    if (!row) throw new AppError(404, 'Row not found')
    res.json({ data: row })
  } catch (err) { next(err) }
})
