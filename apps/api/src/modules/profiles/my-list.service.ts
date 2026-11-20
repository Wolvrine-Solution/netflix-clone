import { Inject, Injectable } from '@nestjs/common'
import { and, eq, myListItem, type Database } from '@netflix/db'
import { AppError } from '../../common/app-error'
import { isForeignKeyViolation } from '../../common/db-errors'
import { assertProfileOwned } from '../../common/profile-access'
import { DB } from '../../common/tokens'

@Injectable()
export class MyListService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(userId: string, profileId: string) {
    await assertProfileOwned(this.db, profileId, userId)
    const items = await this.db.query.myListItem.findMany({
      where: eq(myListItem.profileId, profileId),
      with: { content: { with: { genres: { with: { genre: true } } } } },
      orderBy: (m, { desc }) => desc(m.addedAt),
    })
    return items.map((i) => i.content)
  }

  async add(userId: string, profileId: string, contentId: string) {
    await assertProfileOwned(this.db, profileId, userId)
    if (!contentId) throw new AppError(400, 'contentId is required')
    try {
      // Idempotent: adding an item that is already on the list returns the existing row.
      const [inserted] = await this.db
        .insert(myListItem)
        .values({ profileId, contentId })
        .onConflictDoNothing()
        .returning()
      if (inserted) return inserted
    } catch (e) {
      if (isForeignKeyViolation(e)) throw new AppError(404, 'Content not found')
      throw e
    }
    const [existing] = await this.db
      .select()
      .from(myListItem)
      .where(and(eq(myListItem.profileId, profileId), eq(myListItem.contentId, contentId)))
    return existing!
  }

  async remove(userId: string, profileId: string, contentId: string) {
    await assertProfileOwned(this.db, profileId, userId)
    await this.db
      .delete(myListItem)
      .where(and(eq(myListItem.profileId, profileId), eq(myListItem.contentId, contentId)))
  }
}
