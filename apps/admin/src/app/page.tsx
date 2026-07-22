import { prisma } from '@netflix/db'
import {
  FiFilm,
  FiUsers,
  FiList,
  FiStar,
  FiTrendingUp,
  FiEye,
  FiDollarSign,
  FiClock,
} from 'react-icons/fi'
import Link from 'next/link'
import { RecentActivityTable } from '@/components/RecentActivityTable'
import { ContentTypeChart } from '@/components/charts/ContentTypeChart'

async function getDashboardStats() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalContent,
    totalUsers,
    activeSubscriptions,
    totalWatchEvents,
    newUsersThisMonth,
    newUsersLastMonth,
    avgRating,
    totalMyListAdds,
    contentByType,
    recentContent,
    recentLogs,
  ] = await Promise.all([
    prisma.content.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.watchHistory.count(),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.content.aggregate({ _avg: { rating: true } }),
    prisma.myListItem.count(),
    prisma.content.groupBy({ by: ['mediaType'], _count: { id: true } }),
    prisma.content.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { genres: { include: { genre: true } } },
    }),
    prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { admin: { select: { name: true, email: true } } },
    }),
  ])

  const userGrowth =
    newUsersLastMonth > 0
      ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
      : '0'

  return {
    totalContent,
    totalUsers,
    activeSubscriptions,
    totalWatchEvents,
    newUsersThisMonth,
    avgRating: parseFloat((avgRating._avg.rating ?? 0).toFixed(1)),
    totalMyListAdds,
    estimatedRevenue: activeSubscriptions * 13.99,
    contentByType: {
      movie: contentByType.find((c) => c.mediaType === 'movie')?._count.id ?? 0,
      tv: contentByType.find((c) => c.mediaType === 'tv')?._count.id ?? 0,
    },
    recentContent,
    recentLogs,
    userGrowth: parseFloat(userGrowth),
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const kpis = [
    {
      label: 'Total Content',
      value: stats.totalContent,
      icon: FiFilm,
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      href: '/content',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      sub: `+${stats.newUsersThisMonth} this month`,
      href: '/users',
    },
    {
      label: 'Active Subscribers',
      value: stats.activeSubscriptions,
      icon: FiTrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-900/20',
      href: '/users',
    },
    {
      label: 'Est. Monthly Revenue',
      value: `$${stats.estimatedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: FiDollarSign,
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
    },
    {
      label: 'Watch Events',
      value: stats.totalWatchEvents,
      icon: FiEye,
      color: 'text-pink-400',
      bg: 'bg-pink-900/20',
      href: '/analytics',
    },
    {
      label: 'My List Adds',
      value: stats.totalMyListAdds,
      icon: FiList,
      color: 'text-orange-400',
      bg: 'bg-orange-900/20',
    },
    {
      label: 'Avg Content Rating',
      value: stats.avgRating,
      icon: FiStar,
      color: 'text-yellow-300',
      bg: 'bg-yellow-900/20',
    },
    {
      label: 'User Growth',
      value: `${stats.userGrowth > 0 ? '+' : ''}${stats.userGrowth}%`,
      icon: FiClock,
      color: stats.userGrowth >= 0 ? 'text-green-400' : 'text-red-400',
      bg: stats.userGrowth >= 0 ? 'bg-green-900/20' : 'bg-red-900/20',
      sub: 'vs last month',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-gray-400">Welcome back. Here&apos;s what&apos;s happening.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/content/new"
            className="bg-netflix-red hover:bg-netflix-red-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition"
          >
            + Add Content
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border border-gray-800 bg-gray-900 p-5 ${kpi.href ? 'cursor-pointer transition hover:border-gray-700' : ''}`}
            onClick={
              kpi.href
                ? () => {
                    window.location.href = kpi.href!
                  }
                : undefined
            }
          >
            <div className={`h-10 w-10 rounded-lg ${kpi.bg} mb-3 flex items-center justify-center`}>
              <kpi.icon className={`text-lg ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="mt-0.5 text-sm text-gray-400">{kpi.label}</p>
            {kpi.sub && <p className="mt-1 text-xs text-gray-600">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-base font-semibold">Content by Type</h2>
          <ContentTypeChart movie={stats.contentByType.movie} tv={stats.contentByType.tv} />
        </div>

        <div className="col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recently Added Content</h2>
            <Link href="/content" className="text-xs text-gray-400 transition hover:text-white">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentContent.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                {c.posterPath && (
                  <img
                    src={c.posterPath}
                    alt=""
                    className="h-12 w-8 flex-shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-gray-500">
                    {c.mediaType} ·{' '}
                    {c.genres
                      .slice(0, 2)
                      .map((g) => g.genre.name)
                      .join(', ')}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                    c.status === 'PUBLISHED'
                      ? 'bg-green-900/40 text-green-400'
                      : c.status === 'DRAFT'
                        ? 'bg-yellow-900/40 text-yellow-400'
                        : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Admin Activity</h2>
        </div>
        {stats.recentLogs.length > 0 ? (
          <div className="space-y-2">
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 text-sm">
                <span
                  className={`w-16 flex-shrink-0 rounded px-2 py-0.5 text-center font-mono text-xs ${
                    log.action.startsWith('DELETE')
                      ? 'bg-red-900/30 text-red-400'
                      : log.action.startsWith('CREATE') || log.action === 'IMPORT'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-blue-900/30 text-blue-400'
                  }`}
                >
                  {log.action}
                </span>
                <span className="text-gray-300">
                  {log.resource} {log.resourceId ? `·${log.resourceId.slice(0, 8)}` : ''}
                </span>
                <span className="flex-1 text-right text-xs text-gray-500">
                  {log.admin.name ?? log.admin.email} · {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No admin activity yet.</p>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-4 text-base font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/content/new"
            className="bg-netflix-red hover:bg-netflix-red-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition"
          >
            Import from TMDB
          </Link>
          <Link
            href="/rows"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Configure Rows
          </Link>
          <Link
            href="/users"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Manage Users
          </Link>
          <Link
            href="/genres"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Manage Genres
          </Link>
          <Link
            href="/notifications"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Send Notification
          </Link>
          <Link
            href="/analytics"
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}
