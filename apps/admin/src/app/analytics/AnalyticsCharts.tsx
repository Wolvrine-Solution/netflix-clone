'use client'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

interface KPIs {
  totalUsers: number; totalContent: number; totalSubscriptions: number
  estimatedRevenue: number; watchEvents: number; myListItems: number
}
interface ContentItem { id: string; title: string; posterPath: string; mediaType: string; views: number }
interface GrowthPoint { date: string; count: number }
interface TypeCount { type: string; count: number }
interface RecentUser { id: string; name: string | null; email: string | null; image: string | null; createdAt: string; subscription: { plan: string } | null }

interface Props {
  data: {
    kpis: KPIs
    topContentData: ContentItem[]
    userGrowthData: GrowthPoint[]
    contentByType: TypeCount[]
    recentUsers: RecentUser[]
  }
}

const PIE_COLORS = ['#E50914', '#7c3aed']
const GRID_COLOR = '#262626'
const TEXT_COLOR = '#9ca3af'

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-2 tabular-nums">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export function AnalyticsCharts({ data }: Props) {
  const { kpis, topContentData, userGrowthData, contentByType, recentUsers } = data

  const fmt = new Intl.NumberFormat('en-US').format
  const fmtMoney = (n: number) => `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-400 mt-1">Platform performance overview</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Total Users" value={fmt(kpis.totalUsers)} />
        <KPICard label="Published Content" value={fmt(kpis.totalContent)} />
        <KPICard label="Active Subscriptions" value={fmt(kpis.totalSubscriptions)} />
        <KPICard label="Est. Monthly Revenue" value={fmtMoney(kpis.estimatedRevenue)} sub="Based on active plan counts" />
        <KPICard label="Watch Events" value={fmt(kpis.watchEvents)} />
        <KPICard label="My List Saves" value={fmt(kpis.myListItems)} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="font-semibold mb-4">User Growth (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowthData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis
                dataKey="date"
                tick={{ fill: TEXT_COLOR, fontSize: 10 }}
                tickFormatter={(v: string) => v.slice(5)}
                interval={4}
              />
              <YAxis tick={{ fill: TEXT_COLOR, fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#E50914' }}
              />
              <Line type="monotone" dataKey="count" stroke="#E50914" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Content Type Pie */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="font-semibold mb-4">Content by Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={contentByType}
                dataKey="count"
                nameKey="type"
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                strokeWidth={0}
              >
                {contentByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend
                formatter={(value: string) => <span className="text-gray-400 text-xs capitalize">{value}</span>}
              />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Content Bar */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold mb-4">Most Watched Titles</h2>
        {topContentData.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No watch history data yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topContentData.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tick={{ fill: TEXT_COLOR, fontSize: 11 }} />
                <YAxis type="category" dataKey="title" tick={{ fill: TEXT_COLOR, fontSize: 10 }} width={110} tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="views" fill="#E50914" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 overflow-y-auto max-h-72">
              {topContentData.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-gray-600 w-5 text-right text-xs font-mono">{i + 1}</span>
                  {item.posterPath ? (
                    <img src={item.posterPath} alt="" className="w-7 h-10 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-10 bg-gray-800 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.mediaType}</p>
                  </div>
                  <span className="text-sm font-semibold text-netflix-red tabular-nums">{fmt(item.views)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Signups */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold mb-4">Recent Signups</h2>
        <div className="space-y-3">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              {user.image ? (
                <img src={user.image} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-gray-400">{(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{user.name ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {user.subscription && (
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">{user.subscription.plan}</span>
              )}
              <span className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {recentUsers.length === 0 && <p className="text-gray-500 text-sm">No recent signups.</p>}
        </div>
      </div>
    </div>
  )
}
