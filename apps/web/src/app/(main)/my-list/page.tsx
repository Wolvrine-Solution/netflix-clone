'use client'
import { useMyList } from '@/hooks/useMyList'
import { useModalStore } from '@/store/useModalStore'
import { Spinner } from '@netflix/ui'

export default function MyListPage() {
  const { myList, isLoading } = useMyList()
  const { openModal } = useModalStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-16">
      <h1 className="text-3xl font-bold mb-8">My List</h1>
      {!myList.length ? (
        <div className="py-20 text-center">
          <p className="text-xl text-netflix-light-gray">Your list is empty</p>
          <p className="mt-2 text-sm text-netflix-light-gray">Add titles by clicking the + button on any content</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {myList.map((item) => (
            <button
              key={item.id}
              onClick={() => openModal(item)}
              className="group relative aspect-video overflow-hidden rounded"
            >
              <img
                src={item.posterPath || item.backdropPath}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition">
                <p className="text-xs font-semibold truncate">{item.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
