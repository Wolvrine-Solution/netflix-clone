import { Router } from 'express'
import { prisma } from '@netflix/db'
import { authenticate } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'

export const adminAnalyticsRouter = Router()
adminAnalyticsRouter.use(authenticate, adminOnly)

adminAnalyticsRouter.get('/dashboard', async (_req, res, next) => {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalContent,
      totalUsers,
      totalProfiles,
      activeSubscriptions,
      totalWatchEvents,
      totalMyListAdds,
      avgRating,
      newUsersThisMonth,
      newContentThisMonth,
      contentByType,
    ] = await Promise.all([
      prisma.content.count({ where: { status: 'PUBLISHED' } }),
      prisma.user.count(),
      prisma.profile.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.watchHistory.count(),
      prisma.myListItem.count(),
      prisma.content.aggregate({ _avg: { rating: true } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.content.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.content.groupBy({ by: ['mediaType'], _count: { id: true } }),
    ])

    res.json({
      data: {
        totalContent,
        totalUsers,
        totalProfiles,
        activeSubscriptions,
        totalRevenue: activeSubscriptions * 13.99, // approximate
        totalWatchEvents,
        totalMyListAdds,
        avgRating: parseFloat((avgRating._avg.rating ?? 0).toFixed(2)),
        contentByType: {
          movie: contentByType.find((c) => c.mediaType === 'movie')?._count.id ?? 0,
          tv: contentByType.find((c) => c.mediaType === 'tv')?._count.id ?? 0,
        },
        newUsersThisMonth,
        newContentThisMonth,
      },
    })
  } catch (err) {
    next(err)
  }
})

adminAnalyticsRouter.get('/top-content', async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20')))

    const topWatched = await prisma.watchHistory.groupBy({
      by: ['contentId'],
      _count: { contentId: true },
      _avg: { progress: true },
      orderBy: { _count: { contentId: 'desc' } },
      take: limit,
    })

    const contentIds = topWatched.map((w) => w.contentId)
    const [contents, myListCounts] = await Promise.all([
      prisma.content.findMany({
        where: { id: { in: contentIds } },
        select: { id: true, title: true, posterPath: true, mediaType: true },
      }),
      prisma.myListItem.groupBy({
        by: ['contentId'],
        where: { contentId: { in: contentIds } },
        _count: { contentId: true },
      }),
    ])

    const data = topWatched.map((w) => ({
      contentId: w.contentId,
      title: contents.find((c) => c.id === w.contentId)?.title ?? 'Unknown',
      posterPath: contents.find((c) => c.id === w.contentId)?.posterPath ?? '',
      mediaType: contents.find((c) => c.id === w.contentId)?.mediaType ?? 'movie',
      watchCount: w._count.contentId,
      avgProgress: parseFloat(((w._avg.progress ?? 0) * 100).toFixed(1)),
      myListCount: myListCounts.find((m) => m.contentId === w.contentId)?._count.contentId ?? 0,
    }))

    res.json({ data })
  } catch (err) {
    next(err)
  }
})

adminAnalyticsRouter.get('/user-growth', async (_req, res, next) => {
  try {
    // Last 30 days of user signups
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      d.setHours(0, 0, 0, 0)
      return d
    })

    const counts = await Promise.all(
      days.map(async (day) => {
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)
        const count = await prisma.user.count({
          where: { createdAt: { gte: day, lt: nextDay } },
        })
        return { date: day.toISOString().split('T')[0]!, value: count }
      })
    )

    res.json({ data: counts })
  } catch (err) {
    next(err)
  }
})

adminAnalyticsRouter.get('/recent-logs', async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(String(req.query['limit'] ?? '20')))
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { admin: { select: { name: true, email: true } } },
    })
    res.json({ data: logs })
  } catch (err) {
    next(err)
  }
})
