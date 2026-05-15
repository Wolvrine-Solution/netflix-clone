import { prisma } from '@netflix/db'
import Link from 'next/link'
import { FiPlus } from 'react-icons/fi'

async function getContent(page: number) {
  const limit = 20
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.content.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { genres: { include: { genre: true } } },
    }),
    prisma.content.count(),
  ])
  return { items, total, pages: Math.ceil(total / limit) }
}

interface ContentPageProps {
  searchParams: { page?: string }
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const page = parseInt(searchParams.page ?? '1')
  const { items, total, pages } = await getContent(page)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-gray-400 mt-1">{total} titles</p>
        </div>
        <Link
          href="/content/new"
          className="flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover text-white px-4 py-2 rounded font-medium text-sm transition"
        >
          <FiPlus /> Add Content
        </Link>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left px-6 py-4">Title</th>
              <th className="text-left px-6 py-4">Type</th>
              <th className="text-left px-6 py-4">Rating</th>
              <th className="text-left px-6 py-4">Featured</th>
              <th className="text-left px-6 py-4">Genres</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-800/50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {item.posterPath && (
                      <img src={item.posterPath} alt={item.title} className="w-8 h-12 object-cover rounded" />
                    )}
                    <span className="font-medium">{item.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.mediaType === 'movie' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                    {item.mediaType}
                  </span>
                </td>
                <td className="px-6 py-4 text-yellow-400">{item.rating.toFixed(1)}</td>
                <td className="px-6 py-4">
                  {item.isFeatured && <span className="text-xs bg-netflix-red/20 text-netflix-red px-2 py-0.5 rounded">Featured</span>}
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">
                  {item.genres.slice(0, 2).map((cg) => cg.genre.name).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
              className={`px-3 py-1.5 rounded text-sm ${p === page ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
