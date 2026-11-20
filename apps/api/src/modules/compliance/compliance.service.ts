import { Inject, Injectable } from '@nestjs/common'
import {
  consentRecord,
  content,
  dataSubjectRequest,
  dmcaTakedown,
  and,
  eq,
  inArray,
  licenseWindow,
  lt,
  myListItem,
  profile,
  user,
  watchHistory,
  type Database,
} from '@netflix/db'
import { DB } from '../../common/tokens'

@Injectable()
export class ComplianceService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async recordConsent(userId: string, consentType: string, granted: boolean, ipAddress?: string) {
    const [row] = await this.db
      .insert(consentRecord)
      .values({ userId, consentType, granted, ipAddress })
      .returning()
    return row
  }

  async createDsarRequest(userId: string, type: 'EXPORT' | 'DELETE') {
    const [row] = await this.db
      .insert(dataSubjectRequest)
      .values({ userId, type, status: 'PENDING' })
      .returning()
    return row
  }

  findDsar(requestId: string) {
    return this.db.query.dataSubjectRequest.findFirst({
      where: eq(dataSubjectRequest.id, requestId),
    })
  }

  async processDsarExport(requestId: string) {
    const req = await this.findDsar(requestId)
    if (!req || req.type !== 'EXPORT') return null

    const u = await this.db.query.user.findFirst({
      where: eq(user.id, req.userId),
      with: {
        profiles: { with: { watchHistory: { with: { content: true } } } },
        subscription: true,
      },
    })

    await this.db
      .update(dataSubjectRequest)
      .set({ status: 'COMPLETED', completedAt: new Date() })
      .where(eq(dataSubjectRequest.id, requestId))

    return {
      user: { id: u?.id, email: u?.email, name: u?.name },
      profiles: u?.profiles,
      watchHistory: u?.profiles.flatMap((p) =>
        p.watchHistory.map((h) => ({
          contentId: h.contentId,
          progress: h.progress,
          title: h.content.title,
        }))
      ),
      subscription: u?.subscription ?? null,
      exportedAt: new Date().toISOString(),
    }
  }

  async processDsarDelete(requestId: string) {
    const req = await this.findDsar(requestId)
    if (!req || req.type !== 'DELETE') return false

    await this.db.transaction(async (tx) => {
      const profileIds = tx
        .select({ id: profile.id })
        .from(profile)
        .where(eq(profile.userId, req.userId))
      await tx.delete(watchHistory).where(inArray(watchHistory.profileId, profileIds))
      await tx.delete(myListItem).where(inArray(myListItem.profileId, profileIds))
      await tx.delete(profile).where(eq(profile.userId, req.userId))
      await tx.delete(consentRecord).where(eq(consentRecord.userId, req.userId))
      await tx
        .update(dataSubjectRequest)
        .set({ status: 'COMPLETED', completedAt: new Date() })
        .where(eq(dataSubjectRequest.id, requestId))
    })
    return true
  }

  async createDmcaTakedown(reporterEmail: string, details: string, contentId?: string) {
    const [row] = await this.db
      .insert(dmcaTakedown)
      .values({ reporterEmail, details, contentId })
      .returning()
    return row
  }

  listDmca() {
    return this.db.query.dmcaTakedown.findMany({ orderBy: (t, { desc }) => desc(t.createdAt) })
  }

  /** Archive PUBLISHED content whose license window has ended. Returns how many titles had one. */
  async unpublishExpiredLicenses(): Promise<number> {
    const expired = await this.db
      .selectDistinct({ contentId: licenseWindow.contentId })
      .from(licenseWindow)
      .where(lt(licenseWindow.endsAt, new Date()))
    const contentIds = expired.map((w) => w.contentId)
    if (contentIds.length === 0) return 0

    await this.db
      .update(content)
      .set({ status: 'ARCHIVED' })
      .where(and(inArray(content.id, contentIds), eq(content.status, 'PUBLISHED')))
    return contentIds.length
  }
}
