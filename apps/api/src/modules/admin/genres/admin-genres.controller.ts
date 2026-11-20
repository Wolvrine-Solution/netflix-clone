import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { asc, contentGenre, count, eq, genre, type Database } from '@netflix/db'
import { AdminGuard } from '../../../common/admin.guard'
import { AppError } from '../../../common/app-error'
import { DB } from '../../../common/tokens'
import { ZodPipe } from '../../../common/zod.pipe'
import { intParam, notFound } from '../admin-utils'

const genreSchema = z.object({ id: z.number().int().positive(), name: z.string().min(1) })
const renameSchema = z.object({ name: z.string().min(1) })

@Controller('api/admin/genres')
@UseGuards(AdminGuard)
export class AdminGenresController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get()
  async list() {
    const rows = await this.db
      .select({ id: genre.id, name: genre.name, contents: count(contentGenre.contentId) })
      .from(genre)
      .leftJoin(contentGenre, eq(contentGenre.genreId, genre.id))
      .groupBy(genre.id)
      .orderBy(asc(genre.name))
    return { data: rows.map((r) => ({ id: r.id, name: r.name, _count: { contents: r.contents } })) }
  }

  @Post()
  async upsert(@Body(new ZodPipe(genreSchema)) body: z.infer<typeof genreSchema>) {
    const [g] = await this.db
      .insert(genre)
      .values(body)
      .onConflictDoUpdate({ target: genre.id, set: { name: body.name } })
      .returning()
    return { data: g }
  }

  @Put(':id')
  async rename(@Param('id') id: string, @Body(new ZodPipe(renameSchema)) body: { name: string }) {
    const gid = intParam(id, NaN)
    if (!Number.isFinite(gid)) throw new AppError(400, 'Invalid genre id')
    const [g] = await this.db
      .update(genre)
      .set({ name: body.name })
      .where(eq(genre.id, gid))
      .returning()
    if (!g) notFound('Genre')
    return { data: g }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const gid = intParam(id, NaN)
    if (!Number.isFinite(gid)) throw new AppError(400, 'Invalid genre id')
    const deleted = await this.db.delete(genre).where(eq(genre.id, gid)).returning({ id: genre.id })
    if (!deleted.length) notFound('Genre')
    return { message: 'Genre deleted' }
  }
}
