import { prisma } from '@netflix/db'

async function getAnalytics() {
  const [topWatched, totalHistory, totalMyList] = await Promise.all([
    prisma.watchHistory.groupBy({
      by: ['contentId'],
      _count: { contentId: true },
      orderBy: { _count: { contentId: 'desc' } },
      take: 10,
    }),
    prisma.watchHistory.count(),
    prisma.myListItem.count(),
  ])

  const topContentIds = topWatched.map((w) => w.contentId)
  const topContents = await prisma.content.findMany({ where: { id: { in: topContentIds } } })
  const topWithCount = topWatched.map((w) => ({
    content: topContents.find((c) => c.id === w.contentId),
    count: w._count.contentId,
  }))

  return { topWithCount, totalHistory, totalMyList }
}

export default async function AnalyticsPage() {
  const { topWithCount, totalHistory, totalMyList } = await getAnalytics()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-3xl font-bold">{totalHistory}</p>
          <p className="text-gray-400 mt-1 text-sm">Total Watch Events</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-3xl font-bold">{totalMyList}</p>
          <p className="text-gray-400 mt-1 text-sm">Total My List Adds</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-xl font-semibold mb-4">Most Watched Content</h2>
        <div className="space-y-3">
          {topWithCount.map(({ content, count }, i) => (
            <div key={content?.id ?? i} className="flex items-center gap-4">
              <span className="text-gray-600 w-6 text-center font-mono text-sm">{i + 1}</span>
              {content?.posterPath && (
                <img src={content.posterPath} alt="" className="w-8 h-12 object-cover rounded" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{content?.title ?? 'Unknown'}</p>
                <p className="text-xs text-gray-400">{content?.mediaType}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{count}</p>
                <p className="text-xs text-gray-500">views</p>
              </div>
            </div>
          ))}
          {topWithCount.length === 0 && (
            <p className="text-gray-500 text-sm">No watch history yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
