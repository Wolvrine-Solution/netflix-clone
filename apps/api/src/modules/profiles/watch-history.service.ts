import { Inject, Injectable } from '@nestjs/common'
import { eq, gt, and, watchHistory, type Database } from '@netflix/db'
import { AppError } from '../../common/app-error'
import { assertProfileOwned } from '../../common/profile-access'
import { DB } from '../../common/tokens'

@Injectable()
export class WatchHistoryService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(userId: string, profileId: string) {
    await assertProfileOwned(this.db, profileId, userId)
    return this.db.query.watchHistory.findMany({
      where: and(eq(watchHistory.profileId, profileId), gt(watchHistory.progress, 0.05)),
      with: { content: { with: { genres: { with: { genre: true } } } } },
      orderBy: (w, { desc }) => desc(w.updatedAt),
      limit: 20,
    })
  }

  async record(userId: string, profileId: string, contentId: string, progress: number) {
    await assertProfileOwned(this.db, profileId, userId)
    const [record] = await this.db
      .insert(watchHistory)
      .values({ profileId, contentId, progress })
      .onConflictDoUpdate({
        target: [watchHistory.profileId, watchHistory.contentId],
        set: { progress, updatedAt: new Date() },
      })
      .returning()
    if (!record) throw new AppError(500, 'Something went wrong')
    return record
  }
}
