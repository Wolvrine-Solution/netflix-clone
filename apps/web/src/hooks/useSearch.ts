'use client'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@netflix/ui'
import { api } from '@/lib/api'
import type { ContentItem } from '@netflix/types'

export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) return []
      const res = await api.search(debouncedQuery)
      return res.data.data as ContentItem[]
    },
    enabled: debouncedQuery.trim().length >= 2,
  })

  return { results: data ?? [], isLoading, query: debouncedQuery }
}
