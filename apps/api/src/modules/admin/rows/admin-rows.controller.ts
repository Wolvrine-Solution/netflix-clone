import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { and, asc, contentRow, count, eq, max, row, type Database } from '@netflix/db'
import { AdminGuard } from '../../../common/admin.guard'
import { AppError } from '../../../common/app-error'
import { DB } from '../../../common/tokens'
import { ZodPipe } from '../../../common/zod.pipe'
import { notFound, pgErrorCode } from '../admin-utils'

// Zod 4 re-applies `.default()` under `.partial()`, so the update schema is built without defaults.
const rowBase = z.object({
  title: z.string().min(1),
  query: z.string().min(1),
  order: z.number().int().min(0),
  mediaType: z.string(),
  isActive: z.boolean(),
})
const createRowSchema = rowBase
  .partial()
  .required({ title: true, query: true })
  .extend({ isActive: z.boolean().default(true) })
const updateRowSchema = rowBase.partial()
const reorderSchema = z.object({
  rows: z.array(z.object({ id: z.string(), order: z.number().int() })),
})
const addContentSchema = z.object({ contentId: z.string().min(1) })

@Controller('api/admin/rows')
@UseGuards(AdminGuard)
export class AdminRowsController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get()
  async list() {
    const rows = await this.db
      .select({ row, contents: count(contentRow.contentId) })
      .from(row)
      .leftJoin(contentRow, eq(contentRow.rowId, row.id))
      .groupBy(row.id)
      .orderBy(asc(row.order))
    return {
      data: rows.map((r) => ({
        ...r.row,
        _count: { contents: r.contents },
        contentCount: r.contents,
      })),
    }
  }

  @Post()
  async create(@Body(new ZodPipe(createRowSchema)) body: z.infer<typeof createRowSchema>) {
    const [m] = await this.db.select({ max: max(row.order) }).from(row)
    const [created] = await this.db
      .insert(row)
      .values({ ...body, order: body.order ?? (m?.max ?? -1) + 1 })
      .returning()
    return { data: created }
  }

  // Static route: matched before ':id' regardless of declaration order.
  @Put('reorder')
  async reorder(@Body(new ZodPipe(reorderSchema)) body: z.infer<typeof reorderSchema>) {
    await this.db.transaction(async (tx) => {
      for (const { id, order } of body.rows) {
        const updated = await tx
          .update(row)
          .set({ order, updatedAt: new Date() })
          .where(eq(row.id, id))
          .returning({ id: row.id })
        if (!updated.length) throw new AppError(404, 'Row not found')
      }
    })
    return { message: 'Rows reordered' }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodPipe(updateRowSchema)) body: z.infer<typeof updateRowSchema>
  ) {
    const [updated] = await this.db
      .update(row)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(row.id, id))
      .returning()
    if (!updated) notFound('Row')
    return { data: updated }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.db.delete(row).where(eq(row.id, id)).returning({ id: row.id })
    if (!deleted.length) notFound('Row')
    return { message: 'Row deleted' }
  }

  @Post(':id/content')
  async addContent(
    @Param('id') rowId: string,
    @Body(new ZodPipe(addContentSchema)) body: { contentId: string }
  ) {
    const [r] = await this.db.select({ id: row.id }).from(row).where(eq(row.id, rowId))
    if (!r) notFound('Row')
    const [m] = await this.db
      .select({ max: max(contentRow.order) })
      .from(contentRow)
      .where(eq(contentRow.rowId, rowId))
    try {
      await this.db
        .insert(contentRow)
        .values({ contentId: body.contentId, rowId, order: (m?.max ?? -1) + 1 })
        .onConflictDoNothing()
    } catch (err) {
      if (pgErrorCode(err) === '23503') throw new AppError(404, 'Content not found')
      throw err
    }
    return { message: 'Content added to row' }
  }

  @Delete(':id/content/:contentId')
  async removeContent(@Param('id') rowId: string, @Param('contentId') contentId: string) {
    const deleted = await this.db
      .delete(contentRow)
      .where(and(eq(contentRow.rowId, rowId), eq(contentRow.contentId, contentId)))
      .returning({ id: contentRow.rowId })
    if (!deleted.length) notFound('Row content')
    return { message: 'Content removed from row' }
  }

  @Get(':id/content')
  async contents(@Param('id') id: string) {
    const r = await this.db.query.row.findFirst({
      where: eq(row.id, id),
      with: {
        contents: {
          orderBy: (c, { asc: a }) => a(c.order),
          with: { content: { with: { genres: { with: { genre: true } } } } },
        },
      },
    })
    if (!r) notFound('Row')
    return { data: r }
  }
}
