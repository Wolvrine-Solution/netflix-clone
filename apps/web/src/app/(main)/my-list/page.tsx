'use client'
import { useMyList } from '@/hooks/useMyList'
import { useModalStore } from '@/store/useModalStore'
import { Spinner } from '@netflix/ui'

export default function MyListPage() {
  const { myList, isLoading } = useMyList()
  const { openModal } = useModalStore()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="px-4 pb-20 pt-24 md:px-16">
      <h1 className="mb-8 text-3xl font-bold">My List</h1>
      {!myList.length ? (
        <div className="py-20 text-center">
          <p className="text-netflix-light-gray text-xl">Your list is empty</p>
          <p className="text-netflix-light-gray mt-2 text-sm">
            Add titles by clicking the + button on any content
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {myList.map((item) => (
            <button
              key={item.id}
              onClick={() => openModal(item)}
              className="group relative aspect-video overflow-hidden rounded"
            >
              <img
                src={item.posterPath || item.backdropPath}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                <p className="truncate text-xs font-semibold">{item.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
