import { Inject, Injectable } from '@nestjs/common'
import { and, eq, review, type Database } from '@netflix/db'
import { assertProfileOwned } from '../../common/profile-access'
import { DB } from '../../common/tokens'
import { AppError } from '../../common/app-error'

export interface ReviewInput {
  profileId: string
  rating: number
  comment?: string
}

@Injectable()
export class ReviewsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  listForContent(contentId: string) {
    return this.db.query.review.findMany({
      where: eq(review.contentId, contentId),
      orderBy: (r, { desc }) => desc(r.createdAt),
      limit: 20,
      with: { profile: { columns: { name: true, avatarUrl: true } } },
    })
  }

  async upsert(userId: string, contentId: string, input: ReviewInput) {
    await assertProfileOwned(this.db, input.profileId, userId)
    const [row] = await this.db
      .insert(review)
      .values({
        profileId: input.profileId,
        contentId,
        userId,
        rating: input.rating,
        comment: input.comment,
      })
      .onConflictDoUpdate({
        target: [review.profileId, review.contentId],
        set: { rating: input.rating, comment: input.comment, updatedAt: new Date() },
      })
      .returning()
    if (!row) throw new AppError(500, 'Something went wrong')
    return row
  }

  async remove(userId: string, contentId: string, profileId: string) {
    await assertProfileOwned(this.db, profileId, userId)
    await this.db
      .delete(review)
      .where(and(eq(review.contentId, contentId), eq(review.profileId, profileId)))
  }
}
