import axios from 'axios'
import { getToken } from './auth'

const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export const apiClient = axios.create({ baseURL: `${API_URL}/api` })

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

export const api = {
  auth: {
    signIn: (email: string, password: string) =>
      apiClient.post<{ token: string; user: { id: string; name: string | null; email: string; image: string | null } }>(
        '/auth/signin',
        { email, password }
      ),
    register: (email: string, password: string, name: string) =>
      apiClient.post<{ message: string }>('/register', { email, password, name }),
  },
  rows: () => apiClient.get<{ data: BrowseRow[] }>('/rows'),
  content: (id: string) => apiClient.get<{ data: import('@netflix/types').ContentItem }>(`/content/${id}`),
  featured: () => apiClient.get<{ data: import('@netflix/types').ContentItem | null }>('/content/featured'),
  search: (q: string) =>
    apiClient.get<{ data: import('@netflix/types').ContentItem[] }>(`/search?q=${encodeURIComponent(q)}`),
  profiles: {
    list: () => apiClient.get<{ data: import('@netflix/types').NetflixProfile[] }>('/profiles'),
    create: (data: { name: string; avatarUrl: string; isKid?: boolean }) =>
      apiClient.post<{ data: import('@netflix/types').NetflixProfile }>('/profiles', data),
    update: (id: string, data: Partial<{ name: string; avatarUrl: string; isKid: boolean }>) =>
      apiClient.put<{ data: import('@netflix/types').NetflixProfile }>(`/profiles/${id}`, data),
    delete: (id: string) => apiClient.delete(`/profiles/${id}`),
  },
  myList: {
    get: (profileId: string) =>
      apiClient.get<{ data: import('@netflix/types').ContentItem[] }>(`/profiles/${profileId}/my-list`),
    add: (profileId: string, contentId: string) =>
      apiClient.post(`/profiles/${profileId}/my-list`, { contentId }),
    remove: (profileId: string, contentId: string) =>
      apiClient.delete(`/profiles/${profileId}/my-list/${contentId}`),
  },
  history: {
    get: (profileId: string) => apiClient.get(`/profiles/${profileId}/history`),
    update: (profileId: string, contentId: string, progress: number) =>
      apiClient.put(`/profiles/${profileId}/history`, { contentId, progress }),
  },
}

export interface BrowseRow {
  id: string
  title: string
  items: import('@netflix/types').ContentItem[]
}
