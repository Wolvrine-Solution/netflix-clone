import { Inject, Injectable } from '@nestjs/common'
import {
  and,
  content,
  contentGenre,
  desc,
  eq,
  exists,
  inArray,
  notInArray,
  type Database,
} from '@netflix/db'
import { DB } from '../../common/tokens'

@Injectable()
export class RecommendationsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async forProfile(profileId: string, limit = 20) {
    const history = await this.db.query.watchHistory.findMany({
      where: (h) => eq(h.profileId, profileId),
      orderBy: (h, { desc: d }) => d(h.updatedAt),
      limit: 10,
      with: { content: { with: { genres: { with: { genre: true } } } } },
    })

    const genreIds = new Set<number>()
    for (const h of history) for (const g of h.content.genres) genreIds.add(g.genreId)

    if (genreIds.size === 0) {
      return this.db
        .select()
        .from(content)
        .where(and(eq(content.status, 'PUBLISHED'), eq(content.isFeatured, true)))
        .orderBy(desc(content.rating))
        .limit(limit)
    }

    const watchedIds = history.map((h) => h.contentId)
    return this.db
      .select()
      .from(content)
      .where(
        and(
          eq(content.status, 'PUBLISHED'),
          watchedIds.length ? notInArray(content.id, watchedIds) : undefined,
          exists(
            this.db
              .select({ one: contentGenre.contentId })
              .from(contentGenre)
              .where(
                and(
                  eq(contentGenre.contentId, content.id),
                  inArray(contentGenre.genreId, [...genreIds])
                )
              )
          )
        )
      )
      .orderBy(desc(content.rating))
      .limit(limit)
  }
}
