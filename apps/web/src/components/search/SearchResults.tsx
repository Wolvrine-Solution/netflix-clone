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
        <p className="text-netflix-light-gray text-2xl">No results for &quot;{query}&quot;</p>
        <p className="text-netflix-light-gray mt-2 text-sm">Try a different title or keyword</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-netflix-light-gray mb-6 text-sm">
        {results.length} results for &quot;{query}&quot;
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {results.map((item: ContentItem) => (
          <button
            key={item.id}
            onClick={() => openModal(item)}
            className="group relative aspect-video cursor-pointer overflow-hidden rounded"
          >
            {item.posterPath ? (
              <img
                src={item.posterPath}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="bg-netflix-medium-gray flex h-full w-full items-center justify-center">
                <span className="text-netflix-light-gray px-2 text-center text-xs">
                  {item.title}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 transition group-hover:opacity-100">
              <p className="truncate text-xs font-semibold">{item.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
