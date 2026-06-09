import { prisma } from '@netflix/db'
import Link from 'next/link'
import { FiPlus, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi'
import { ContentActions } from './ContentActions'

async function getContent(page: number, q: string, mediaType: string, status: string) {
  const limit = 20
  const skip = (page - 1) * limit
  const where = {
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    ...(mediaType && ['movie', 'tv'].includes(mediaType) ? { mediaType: mediaType as 'movie' | 'tv' } : {}),
    ...(status ? { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.content.findMany({
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
      where,
      include: { genres: { include: { genre: true } }, videoFiles: { select: { quality: true } } },
    }),
    prisma.content.count({ where }),
  ])
  return { items, total, pages: Math.ceil(total / limit) }
}

interface PageProps {
  searchParams: { page?: string; q?: string; mediaType?: string; status?: string }
}

export default async function ContentPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const q = searchParams.q ?? ''
  const mediaType = searchParams.mediaType ?? ''
  const status = searchParams.status ?? ''
  const { items, total, pages } = await getContent(page, q, mediaType, status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content</h1>
          <p className="text-gray-400 mt-1">{total} titles</p>
        </div>
        <Link href="/content/new" className="flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover text-white px-4 py-2 rounded-lg font-medium text-sm transition">
          <FiPlus /> Add Content
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search titles…"
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-netflix-red w-56"
        />
        <select name="mediaType" defaultValue={mediaType} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-netflix-red">
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
        <select name="status" defaultValue={status} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-netflix-red">
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition">Filter</button>
        {(q || mediaType || status) && (
          <Link href="/content" className="text-gray-400 hover:text-white px-4 py-2 text-sm">Clear</Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/80 text-gray-400">
            <tr>
              <th className="text-left px-5 py-3.5">Title</th>
              <th className="text-left px-5 py-3.5">Type</th>
              <th className="text-left px-5 py-3.5">Status</th>
              <th className="text-left px-5 py-3.5">Rating</th>
              <th className="text-left px-5 py-3.5">Videos</th>
              <th className="text-left px-5 py-3.5">Genres</th>
              <th className="text-left px-5 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-800/30 transition group">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {item.posterPath && <img src={item.posterPath} alt="" className="w-8 h-11 object-cover rounded flex-shrink-0" />}
                    <div>
                      <p className="font-medium leading-tight">{item.title}</p>
                      {item.isFeatured && (
                        <span className="text-xs text-yellow-400 flex items-center gap-1 mt-0.5"><FiStar className="text-[10px]" /> Featured</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.mediaType === 'movie' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                    {item.mediaType}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.status === 'PUBLISHED' ? 'bg-green-900/40 text-green-400' :
                    item.status === 'DRAFT' ? 'bg-yellow-900/40 text-yellow-400' :
                    'bg-gray-800 text-gray-500'
                  }`}>{item.status}</span>
                </td>
                <td className="px-5 py-3 text-yellow-400 font-mono text-xs">{item.rating.toFixed(1)}</td>
                <td className="px-5 py-3">
                  {item.videoFiles.length > 0 ? (
                    <span className="text-xs text-green-400">{item.videoFiles.length} file{item.videoFiles.length !== 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-xs text-gray-600">No video</span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">{item.genres.slice(0, 2).map((g) => g.genre.name).join(', ')}</td>
                <td className="px-5 py-3">
                  <ContentActions contentId={item.id} contentTitle={item.title} isFeatured={item.isFeatured} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-gray-500">No content found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&q=${q}&mediaType=${mediaType}&status=${status}`}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${p === page ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
