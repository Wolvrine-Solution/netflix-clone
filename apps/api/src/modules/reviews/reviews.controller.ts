import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import { z } from 'zod'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { ZodPipe } from '../../common/zod.pipe'
import { ReviewsService } from './reviews.service'

// ids are cuid (legacy rows) or cuid2 (rows created after the Drizzle migration)
const reviewSchema = z.object({
  profileId: z.union([z.cuid(), z.cuid2()]),
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(1000).optional(),
})

@Controller(['api/reviews', 'api/v1/reviews'])
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(@Inject(ReviewsService) private readonly reviews: ReviewsService) {}

  @Get(':contentId')
  async list(@Param('contentId') contentId: string) {
    return { data: await this.reviews.listForContent(contentId) }
  }

  @Post(':contentId')
  async upsert(
    @UserId() userId: string,
    @Param('contentId') contentId: string,
    @Body(
      new ZodPipe(
        z.preprocess((v) => v ?? {}, reviewSchema) as unknown as z.ZodType<
          z.infer<typeof reviewSchema>
        >
      )
    )
    body: z.infer<typeof reviewSchema>
  ) {
    return { data: await this.reviews.upsert(userId, contentId, body) }
  }

  @Delete(':contentId')
  async remove(
    @UserId() userId: string,
    @Param('contentId') contentId: string,
    @Query('profileId') profileId: string | undefined,
    @Res({ passthrough: true }) reply: FastifyReply
  ) {
    if (!profileId) {
      // Preserved from the Express route: this 400 has no error/statusCode fields.
      void reply.status(400)
      return { message: 'profileId query parameter required' }
    }
    await this.reviews.remove(userId, contentId, profileId)
    return { message: 'Review deleted' }
  }
}
