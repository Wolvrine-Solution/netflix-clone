import { Suspense } from 'react'
import { SearchResults } from '@/components/search/SearchResults'

interface SearchPageProps {
  searchParams: { q?: string }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? ''

  return (
    <div className="px-4 pb-20 pt-24 md:px-16">
      {query ? (
        <Suspense fallback={<p className="text-netflix-light-gray">Searching...</p>}>
          <SearchResults query={query} />
        </Suspense>
      ) : (
        <p className="text-netflix-light-gray text-xl">Start typing to search...</p>
      )}
    </div>
  )
}
