import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export function useSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.search(debouncedQuery).then((r) => r.data.data),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  return {
    query,
    setQuery,
    results: data ?? [],
    isLoading: isLoading || isFetching,
    hasQuery: debouncedQuery.length >= 2,
  }
}
