'use client'
import { useSearch } from '@/hooks/useSearch'
import { useModalStore } from '@/store/useModalStore'
import { Spinner } from '@netflix/ui'
import type { ContentItem } from '@netflix/types'

interface SearchResultsProps {
  query: string
}

export function SearchResults({ query }: SearchResultsProps) {
  const { results, isLoading } = useSearch(query)
  const { openModal } = useModalStore()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-2xl text-netflix-light-gray">No results for &quot;{query}&quot;</p>
        <p className="mt-2 text-sm text-netflix-light-gray">Try a different title or keyword</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-netflix-light-gray mb-6">{results.length} results for &quot;{query}&quot;</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {results.map((item: ContentItem) => (
          <button
            key={item.id}
            onClick={() => openModal(item)}
            className="group relative aspect-video overflow-hidden rounded cursor-pointer"
          >
            {item.posterPath ? (
              <img
                src={item.posterPath}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-netflix-medium-gray flex items-center justify-center">
                <span className="text-xs text-center px-2 text-netflix-light-gray">{item.title}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition">
              <p className="text-xs font-semibold truncate">{item.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
