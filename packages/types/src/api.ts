export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  totalPages: number
  totalResults: number
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface BrowseRow {
  id: string
  title: string
  items: import('./content').ContentItem[]
}
