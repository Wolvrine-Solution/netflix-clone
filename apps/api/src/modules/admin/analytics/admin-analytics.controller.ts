import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common'
import {
  avg,
  content,
  count,
  desc,
  eq,
  gte,
  inArray,
  myListItem,
  profile,
  sql,
  subscription,
  user,
  watchHistory,
  type Database,
} from '@netflix/db'
import { AdminGuard } from '../../../common/admin.guard'
import { DB } from '../../../common/tokens'
import { intParam } from '../admin-utils'

@Controller('api/admin/analytics')
@UseGuards(AdminGuard)
export class AdminAnalyticsController {
  constructor(@Inject(DB) private readonly db: Database) {}

  private total(q: Promise<{ n: number }[]>) {
    return q.then((r) => r[0]?.n ?? 0)
  }

  @Get('dashboard')
  async dashboard() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const db = this.db

    const [
      totalContent,
      totalUsers,
      totalProfiles,
      activeSubscriptions,
      totalWatchEvents,
      totalMyListAdds,
      [avgRow],
      newUsersThisMonth,
      newContentThisMonth,
      contentByType,
    ] = await Promise.all([
      this.total(db.select({ n: count() }).from(content).where(eq(content.status, 'PUBLISHED'))),
      this.total(db.select({ n: count() }).from(user)),
      this.total(db.select({ n: count() }).from(profile)),
      this.total(
        db.select({ n: count() }).from(subscription).where(eq(subscription.status, 'ACTIVE'))
      ),
      this.total(db.select({ n: count() }).from(watchHistory)),
      this.total(db.select({ n: count() }).from(myListItem)),
      db.select({ avg: avg(content.rating) }).from(content),
      this.total(db.select({ n: count() }).from(user).where(gte(user.createdAt, monthStart))),
      this.total(db.select({ n: count() }).from(content).where(gte(content.createdAt, monthStart))),
      db
        .select({ mediaType: content.mediaType, n: count() })
        .from(content)
        .groupBy(content.mediaType),
    ])

    return {
      data: {
        totalContent,
        totalUsers,
        totalProfiles,
        activeSubscriptions,
        totalRevenue: activeSubscriptions * 13.99, // approximate
        totalWatchEvents,
        totalMyListAdds,
        avgRating: parseFloat(Number(avgRow?.avg ?? 0).toFixed(2)),
        contentByType: {
          movie: contentByType.find((c) => c.mediaType === 'movie')?.n ?? 0,
          tv: contentByType.find((c) => c.mediaType === 'tv')?.n ?? 0,
        },
        newUsersThisMonth,
        newContentThisMonth,
      },
    }
  }

  @Get('top-content')
  async topContent(@Query('limit') limitQ?: string) {
    const limit = Math.min(50, intParam(limitQ, 20))
    const topWatched = await this.db
      .select({
        contentId: watchHistory.contentId,
        watchCount: count(),
        avgProgress: avg(watchHistory.progress),
      })
      .from(watchHistory)
      .groupBy(watchHistory.contentId)
      .orderBy(desc(count()))
      .limit(limit)

    const ids = topWatched.map((w) => w.contentId)
    const [contents, myListCounts] = ids.length
      ? await Promise.all([
          this.db
            .select({
              id: content.id,
              title: content.title,
              posterPath: content.posterPath,
              mediaType: content.mediaType,
            })
            .from(content)
            .where(inArray(content.id, ids)),
          this.db
            .select({ contentId: myListItem.contentId, n: count() })
            .from(myListItem)
            .where(inArray(myListItem.contentId, ids))
            .groupBy(myListItem.contentId),
        ])
      : [[], []]

    return {
      data: topWatched.map((w) => {
        const c = contents.find((x) => x.id === w.contentId)
        return {
          contentId: w.contentId,
          title: c?.title ?? 'Unknown',
          posterPath: c?.posterPath ?? '',
          mediaType: c?.mediaType ?? 'movie',
          watchCount: w.watchCount,
          avgProgress: parseFloat((Number(w.avgProgress ?? 0) * 100).toFixed(1)),
          myListCount: myListCounts.find((m) => m.contentId === w.contentId)?.n ?? 0,
        }
      }),
    }
  }

  /** Signups per UTC day for the last 30 days (one grouped query). */
  @Get('user-growth')
  async userGrowth() {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - (29 - i))
      d.setUTCHours(0, 0, 0, 0)
      return d
    })
    const day = sql<string>`to_char(${user.createdAt}, 'YYYY-MM-DD')`
    const rows = await this.db
      .select({ day, n: count() })
      .from(user)
      .where(gte(user.createdAt, days[0]!))
      .groupBy(day)
    const byDay = new Map(rows.map((r) => [r.day, r.n]))
    return {
      data: days.map((d) => {
        const date = d.toISOString().split('T')[0]!
        return { date, value: byDay.get(date) ?? 0 }
      }),
    }
  }

  @Get('recent-logs')
  async recentLogs(@Query('limit') limitQ?: string) {
    const limit = Math.min(50, intParam(limitQ, 20))
    const logs = await this.db.query.adminLog.findMany({
      orderBy: (l, { desc: d }) => d(l.createdAt),
      limit,
      with: { admin: { columns: { name: true, email: true } } },
    })
    return { data: logs }
  }
}
