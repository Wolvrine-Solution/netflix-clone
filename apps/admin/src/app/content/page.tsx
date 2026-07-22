import { prisma } from '@netflix/db'
import Link from 'next/link'
import { FiPlus, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi'
import { ContentActions } from './ContentActions'

async function getContent(page: number, q: string, mediaType: string, status: string) {
  const limit = 20
  const skip = (page - 1) * limit
  const where = {
    ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    ...(mediaType && ['movie', 'tv'].includes(mediaType)
      ? { mediaType: mediaType as 'movie' | 'tv' }
      : {}),
    ...(status ? { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.content.findMany({
      skip,
      take: limit,
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
          <p className="mt-1 text-gray-400">{total} titles</p>
        </div>
        <Link
          href="/content/new"
          className="bg-netflix-red hover:bg-netflix-red-hover flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
        >
          <FiPlus /> Add Content
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search titles…"
          className="focus:border-netflix-red w-56 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white outline-none"
        />
        <select
          name="mediaType"
          defaultValue={mediaType}
          className="focus:border-netflix-red rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white outline-none"
        >
          <option value="">All Types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV Shows</option>
        </select>
        <select
          name="status"
          defaultValue={status}
          className="focus:border-netflix-red rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white outline-none"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition hover:bg-gray-700"
        >
          Filter
        </button>
        {(q || mediaType || status) && (
          <Link href="/content" className="px-4 py-2 text-sm text-gray-400 hover:text-white">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/80 text-gray-400">
            <tr>
              <th className="px-5 py-3.5 text-left">Title</th>
              <th className="px-5 py-3.5 text-left">Type</th>
              <th className="px-5 py-3.5 text-left">Status</th>
              <th className="px-5 py-3.5 text-left">Rating</th>
              <th className="px-5 py-3.5 text-left">Videos</th>
              <th className="px-5 py-3.5 text-left">Genres</th>
              <th className="px-5 py-3.5 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="group transition hover:bg-gray-800/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {item.posterPath && (
                      <img
                        src={item.posterPath}
                        alt=""
                        className="h-11 w-8 flex-shrink-0 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium leading-tight">{item.title}</p>
                      {item.isFeatured && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-yellow-400">
                          <FiStar className="text-[10px]" /> Featured
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${item.mediaType === 'movie' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}
                  >
                    {item.mediaType}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      item.status === 'PUBLISHED'
                        ? 'bg-green-900/40 text-green-400'
                        : item.status === 'DRAFT'
                          ? 'bg-yellow-900/40 text-yellow-400'
                          : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-yellow-400">
                  {item.rating.toFixed(1)}
                </td>
                <td className="px-5 py-3">
                  {item.videoFiles.length > 0 ? (
                    <span className="text-xs text-green-400">
                      {item.videoFiles.length} file{item.videoFiles.length !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">No video</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">
                  {item.genres
                    .slice(0, 2)
                    .map((g) => g.genre.name)
                    .join(', ')}
                </td>
                <td className="px-5 py-3">
                  <ContentActions
                    contentId={item.id}
                    contentTitle={item.title}
                    isFeatured={item.isFeatured}
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-500">
                  No content found.
                </td>
              </tr>
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
              className={`rounded-lg px-3 py-1.5 text-sm transition ${p === page ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
