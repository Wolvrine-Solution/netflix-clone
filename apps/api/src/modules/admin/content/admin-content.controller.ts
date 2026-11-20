import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import { AdminGuard } from '../../../common/admin.guard'
import type { AppRequest } from '../../../common/request-context'
import { ZodPipe } from '../../../common/zod.pipe'
import { mapContent } from '../../../lib/contentMapper'
import { AdminLogService } from '../admin-log.service'
import { pageParams } from '../admin-utils'
import {
  createContentSchema,
  episodeSchema,
  importSchema,
  seasonSchema,
  updateContentSchema,
  updateEpisodeSchema,
  videoSchema,
  type CreateContent,
  type EpisodeInput,
  type SeasonInput,
  type UpdateContent,
  type VideoInput,
} from './admin-content.schemas'
import { AdminContentService } from './admin-content.service'

@Controller('api/admin/content')
@UseGuards(AdminGuard)
export class AdminContentController {
  constructor(
    @Inject(AdminContentService) private readonly svc: AdminContentService,
    @Inject(AdminLogService) private readonly audit: AdminLogService
  ) {}

  @Get()
  list(@Query() query: Record<string, string | undefined>) {
    const { page, limit } = pageParams(query, 50)
    return this.svc.list({
      page,
      limit,
      q: String(query['q'] ?? '').trim(),
      mediaType: query['mediaType'],
      status: query['status'],
    })
  }

  @Post()
  async create(
    @Req() req: AppRequest,
    @Body(new ZodPipe(createContentSchema)) body: CreateContent
  ) {
    const created = await this.svc.create(body)
    await this.audit.log(req, 'CREATE', 'Content', created.id, { title: created.title })
    return { data: mapContent(created) }
  }

  @Post('import')
  async importFromTmdb(
    @Req() req: AppRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Body(new ZodPipe(importSchema)) body: { tmdbId: number; mediaType: 'movie' | 'tv' }
  ) {
    const existing = await this.svc.findByTmdbId(body.tmdbId)
    if (existing) {
      void reply.status(200)
      return { data: mapContent({ ...existing, genres: [] }), message: 'Already imported' }
    }
    const created = await this.svc.importFromTmdb(body.tmdbId, body.mediaType)
    await this.audit.log(req, 'IMPORT', 'Content', created.id, {
      tmdbId: body.tmdbId,
      title: created.title,
    })
    return { data: mapContent(created) }
  }

  @Get('tmdb-search')
  async tmdbSearch(@Query('q') q?: string) {
    const term = String(q ?? '').trim()
    if (!term) return { results: [] }
    return { results: await this.svc.tmdbSearch(term) }
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return { data: await this.svc.detail(id) }
  }

  @Put(':id')
  async update(
    @Req() req: AppRequest,
    @Param('id') id: string,
    @Body(new ZodPipe(updateContentSchema)) body: UpdateContent
  ) {
    const updated = await this.svc.update(id, body)
    const { genreIds: _g, ...fields } = body
    await this.audit.log(req, 'UPDATE', 'Content', id, { fields: Object.keys(fields) })
    return { data: mapContent(updated) }
  }

  @Delete(':id')
  async remove(@Req() req: AppRequest, @Param('id') id: string) {
    const removed = await this.svc.remove(id)
    await this.audit.log(req, 'DELETE', 'Content', id, { title: removed.title })
    return { message: 'Content deleted' }
  }

  @Patch(':id/featured')
  async featured(
    @Req() req: AppRequest,
    @Param('id') id: string,
    @Body() body: { isFeatured: boolean }
  ) {
    const updated = await this.svc.setFeatured(id, Boolean(body?.isFeatured))
    await this.audit.log(req, 'SET_FEATURED', 'Content', id, {
      isFeatured: Boolean(body?.isFeatured),
    })
    return { data: updated }
  }

  @Post(':id/videos')
  async addVideo(@Param('id') id: string, @Body(new ZodPipe(videoSchema)) body: VideoInput) {
    return { data: await this.svc.addVideo(id, body) }
  }

  @Delete(':id/videos/:videoId')
  async removeVideo(@Param('videoId') videoId: string) {
    await this.svc.removeVideo(videoId)
    return { message: 'Video file removed' }
  }

  @Post(':id/seasons')
  async addSeason(@Param('id') id: string, @Body(new ZodPipe(seasonSchema)) body: SeasonInput) {
    return { data: await this.svc.addSeason(id, body) }
  }

  @Post(':id/seasons/:seasonId/episodes')
  async addEpisode(
    @Param('seasonId') seasonId: string,
    @Body(new ZodPipe(episodeSchema)) body: EpisodeInput
  ) {
    return { data: await this.svc.addEpisode(seasonId, body) }
  }

  @Put(':id/seasons/:seasonId/episodes/:episodeId')
  @HttpCode(200)
  async updateEpisode(
    @Param('episodeId') episodeId: string,
    @Body(new ZodPipe(updateEpisodeSchema)) body: Partial<EpisodeInput>
  ) {
    return { data: await this.svc.updateEpisode(episodeId, body) }
  }

  @Delete(':id/seasons/:seasonId/episodes/:episodeId')
  async removeEpisode(@Param('episodeId') episodeId: string) {
    await this.svc.removeEpisode(episodeId)
    return { message: 'Episode deleted' }
  }
}
