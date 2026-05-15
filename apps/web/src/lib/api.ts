import axios from 'axios'
import { getSession } from 'next-auth/react'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

export const apiClient = axios.create({ baseURL: `${API_URL}/api` })

apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const session = await getSession()
    if (session) {
      config.headers['Authorization'] = `Bearer ${(session as { accessToken?: string }).accessToken ?? ''}`
    }
  }
  return config
})

export const api = {
  rows: () => apiClient.get('/rows'),
  content: (id: string) => apiClient.get(`/content/${id}`),
  featured: () => apiClient.get('/content/featured'),
  search: (q: string) => apiClient.get(`/search?q=${encodeURIComponent(q)}`),
  profiles: {
    list: () => apiClient.get('/profiles'),
    create: (data: { name: string; avatarUrl: string; isKid?: boolean }) =>
      apiClient.post('/profiles', data),
    update: (id: string, data: Partial<{ name: string; avatarUrl: string; isKid: boolean }>) =>
      apiClient.put(`/profiles/${id}`, data),
    delete: (id: string) => apiClient.delete(`/profiles/${id}`),
  },
  myList: {
    get: (profileId: string) => apiClient.get(`/profiles/${profileId}/my-list`),
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
