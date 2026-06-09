export interface DashboardStats {
  totalContent: number
  totalUsers: number
  totalProfiles: number
  activeSubscriptions: number
  totalRevenue: number
  totalWatchEvents: number
  totalMyListAdds: number
  avgRating: number
  contentByType: { movie: number; tv: number }
  newUsersThisMonth: number
  newContentThisMonth: number
}

export interface AdminUser {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  isSuspended: boolean
  createdAt: string
  profileCount: number
  subscription: {
    plan: string
    status: string
  } | null
}

export interface AdminContent {
  id: string
  tmdbId?: number
  title: string
  mediaType: string
  status: string
  posterPath: string
  rating: number
  isFeatured: boolean
  genres: { name: string }[]
  videoFiles: { quality: string; url: string }[]
  seasons?: number
  runtime?: number
  createdAt: string
  updatedAt: string
}

export interface AdminRow {
  id: string
  title: string
  query: string
  order: number
  mediaType?: string
  isActive: boolean
  contentCount: number
  createdAt: string
}

export interface AdminLog {
  id: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  createdAt: string
  admin: { name: string | null; email: string }
}

export interface AnalyticsPoint {
  date: string
  value: number
}

export interface ContentAnalytics {
  contentId: string
  title: string
  posterPath: string
  mediaType: string
  watchCount: number
  avgProgress: number
  myListCount: number
}
