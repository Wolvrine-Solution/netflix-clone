import { prisma } from '@netflix/db'
import { FiFilm, FiUsers, FiList, FiStar } from 'react-icons/fi'

async function getStats() {
  const [totalContent, totalUsers, totalProfiles, avgRating] = await Promise.all([
    prisma.content.count(),
    prisma.user.count(),
    prisma.profile.count(),
    prisma.content.aggregate({ _avg: { rating: true } }),
  ])
  return {
    totalContent,
    totalUsers,
    totalProfiles,
    avgRating: avgRating._avg.rating?.toFixed(1) ?? '0',
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const cards = [
    { label: 'Total Content', value: stats.totalContent, icon: FiFilm, color: 'text-blue-400' },
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'text-green-400' },
    { label: 'Total Profiles', value: stats.totalProfiles, icon: FiList, color: 'text-purple-400' },
    { label: 'Avg Rating', value: stats.avgRating, icon: FiStar, color: 'text-yellow-400' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`text-2xl ${card.color}`} />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/content" className="bg-netflix-red hover:bg-netflix-red-hover text-white px-4 py-2 rounded font-medium text-sm transition">
            Manage Content
          </a>
          <a href="/rows" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium text-sm transition">
            Configure Rows
          </a>
          <a href="/users" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium text-sm transition">
            View Users
          </a>
        </div>
      </div>
    </div>
  )
}
