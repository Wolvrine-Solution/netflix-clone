import { Body, Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { AdminGuard } from '../../common/admin.guard'
import { ZodPipe } from '../../common/zod.pipe'
import { PlaybackService } from '../playback/playback.service'
import { AssetsService } from './assets.service'

const UploadBody = z.object({
  contentId: z.string(),
  parts: z.number().int().min(1).max(10).optional(),
})
const CaptionBody = z.object({ language: z.string(), url: z.url() })

@Controller('api/v1/assets')
@UseGuards(AdminGuard)
export class AssetsController {
  constructor(
    @Inject(AssetsService) private readonly assets: AssetsService,
    @Inject(PlaybackService) private readonly playback: PlaybackService
  ) {}

  @Post('upload-urls')
  @HttpCode(200)
  async uploadUrls(@Body(new ZodPipe(UploadBody)) body: z.infer<typeof UploadBody>) {
    const urls = this.playback.generateUploadUrls(body.contentId, body.parts ?? 1)
    const created = await this.assets.createAsset(body.contentId, urls.key)
    return { data: { ...urls, assetId: created.id } }
  }

  @Post(':assetId/transcode')
  @HttpCode(200)
  async transcode(@Param('assetId') assetId: string) {
    await this.assets.runTranscodeJob(assetId)
    return { data: (await this.assets.findById(assetId)) ?? null }
  }

  @Get(':contentId')
  async list(@Param('contentId') contentId: string) {
    return { data: await this.assets.listForContent(contentId) }
  }

  @Post(':contentId/captions')
  @HttpCode(200)
  async caption(
    @Param('contentId') contentId: string,
    @Body(new ZodPipe(CaptionBody)) body: z.infer<typeof CaptionBody>
  ) {
    return { data: await this.assets.addCaption(contentId, body.language, body.url) }
  }
}
