import {
  content,
  count,
  db,
  desc,
  eq,
  gte,
  inArray,
  myListItem,
  subscription,
  user,
  watchHistory,
  asc,
} from '@netflix/db'
import { AnalyticsCharts } from './AnalyticsCharts'

export const dynamic = 'force-dynamic'

async function getAnalyticsData() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalContent,
    totalSubscriptions,
    watchEvents,
    myListItems,
    topWatched,
    userGrowthRaw,
    contentByType,
    recentUsers,
  ] = await Promise.all([
    db.$count(user),
    db.$count(content, eq(content.status, 'PUBLISHED')),
    db.$count(subscription, eq(subscription.status, 'ACTIVE')),
    db.$count(watchHistory),
    db.$count(myListItem),
    db
      .select({ contentId: watchHistory.contentId, n: count() })
      .from(watchHistory)
      .groupBy(watchHistory.contentId)
      .orderBy(desc(count()))
      .limit(10),
    db
      .select({ createdAt: user.createdAt, n: count() })
      .from(user)
      .where(gte(user.createdAt, thirtyDaysAgo))
      .groupBy(user.createdAt)
      .orderBy(asc(user.createdAt)),
    db
      .select({ mediaType: content.mediaType, n: count() })
      .from(content)
      .groupBy(content.mediaType),
    db.query.user.findMany({
      orderBy: (u, { desc: d }) => d(u.createdAt),
      limit: 5,
      columns: { id: true, name: true, email: true, image: true, createdAt: true },
      with: { subscription: { columns: { plan: true } } },
    }),
  ])

  // Fetch top content details
  const topContentIds = topWatched.map((w) => w.contentId)
  const topContents = topContentIds.length
    ? await db
        .select({
          id: content.id,
          title: content.title,
          posterPath: content.posterPath,
          mediaType: content.mediaType,
          rating: content.rating,
        })
        .from(content)
        .where(inArray(content.id, topContentIds))
    : []
  const topContentData = topWatched.map((w) => ({
    id: w.contentId,
    title: topContents.find((c) => c.id === w.contentId)?.title ?? 'Unknown',
    posterPath: topContents.find((c) => c.id === w.contentId)?.posterPath ?? '',
    mediaType: topContents.find((c) => c.id === w.contentId)?.mediaType ?? '',
    views: w.n,
  }))

  // Build day-by-day user growth
  const growthMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 86400000)
    growthMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of userGrowthRaw) {
    const day = new Date(row.createdAt).toISOString().slice(0, 10)
    if (day in growthMap) growthMap[day] = (growthMap[day] ?? 0) + row.n
  }
  const userGrowthData = Object.entries(growthMap).map(([date, count]) => ({ date, count }))

  // Revenue estimate (BASIC=$8.99, STANDARD=$13.99, PREMIUM=$17.99)
  const subsByPlan = await db
    .select({ plan: subscription.plan, n: count() })
    .from(subscription)
    .where(eq(subscription.status, 'ACTIVE'))
    .groupBy(subscription.plan)
  const pricing: Record<string, number> = { BASIC: 8.99, STANDARD: 13.99, PREMIUM: 17.99 }
  const estimatedRevenue = subsByPlan.reduce((sum, s) => sum + s.n * (pricing[s.plan] ?? 0), 0)

  return {
    kpis: {
      totalUsers,
      totalContent,
      totalSubscriptions,
      estimatedRevenue,
      watchEvents,
      myListItems,
    },
    topContentData,
    userGrowthData,
    contentByType: contentByType.map((c) => ({ type: c.mediaType, count: c.n })),
    recentUsers,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  return <AnalyticsCharts data={JSON.parse(JSON.stringify(data))} />
}
