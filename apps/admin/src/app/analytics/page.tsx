import { prisma } from '@netflix/db'
import { AnalyticsCharts } from './AnalyticsCharts'

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
    prisma.user.count(),
    prisma.content.count({ where: { status: 'PUBLISHED' } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.watchHistory.count(),
    prisma.myListItem.count(),
    prisma.watchHistory.groupBy({
      by: ['contentId'],
      _count: { contentId: true },
      orderBy: { _count: { contentId: 'desc' } },
      take: 10,
    }),
    prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.content.groupBy({
      by: ['mediaType'],
      _count: { id: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        subscription: { select: { plan: true } },
      },
    }),
  ])

  // Fetch top content details
  const topContentIds = topWatched.map((w) => w.contentId)
  const topContents = await prisma.content.findMany({
    where: { id: { in: topContentIds } },
    select: { id: true, title: true, posterPath: true, mediaType: true, rating: true },
  })
  const topContentData = topWatched.map((w) => ({
    id: w.contentId,
    title: topContents.find((c) => c.id === w.contentId)?.title ?? 'Unknown',
    posterPath: topContents.find((c) => c.id === w.contentId)?.posterPath ?? '',
    mediaType: topContents.find((c) => c.id === w.contentId)?.mediaType ?? '',
    views: w._count.contentId,
  }))

  // Build day-by-day user growth
  const growthMap: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 86400000)
    growthMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of userGrowthRaw) {
    const day = new Date(row.createdAt).toISOString().slice(0, 10)
    if (day in growthMap) growthMap[day] = (growthMap[day] ?? 0) + row._count.id
  }
  const userGrowthData = Object.entries(growthMap).map(([date, count]) => ({ date, count }))

  // Revenue estimate (BASIC=$8.99, STANDARD=$13.99, PREMIUM=$17.99)
  const subsByPlan = await prisma.subscription.groupBy({
    by: ['plan'],
    _count: { id: true },
    where: { status: 'ACTIVE' },
  })
  const pricing: Record<string, number> = { BASIC: 8.99, STANDARD: 13.99, PREMIUM: 17.99 }
  const estimatedRevenue = subsByPlan.reduce(
    (sum, s) => sum + s._count.id * (pricing[s.plan] ?? 0),
    0
  )

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
    contentByType: contentByType.map((c) => ({ type: c.mediaType, count: c._count.id })),
    recentUsers,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()
  return <AnalyticsCharts data={JSON.parse(JSON.stringify(data))} />
}
