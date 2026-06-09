import { prisma } from '@netflix/db'
import { HeroBanner } from '@/components/home/HeroBanner'
import { MovieRow } from '@/components/home/MovieRow'
import { ContinueWatchingRow } from '@/components/home/ContinueWatchingRow'
import type { ContentItem, BrowseRow } from '@netflix/types'

async function getBrowseData(): Promise<{ featured: ContentItem | null; rows: BrowseRow[] }> {
  const [featuredContent, rows] = await Promise.all([
    prisma.content.findFirst({
      where: { isFeatured: true },
      include: { genres: { include: { genre: true } } },
    }),
    prisma.row.findMany({
      orderBy: { order: 'asc' },
      include: {
        contents: {
          orderBy: { order: 'asc' },
          take: 20,
          include: { content: { include: { genres: { include: { genre: true } } } } },
        },
      },
    }),
  ])

  const mapContent = (c: typeof featuredContent): ContentItem | null => {
    if (!c) return null
    return {
      id: c.id, tmdbId: c.tmdbId ?? undefined, title: c.title, description: c.description,
      posterPath: c.posterPath, backdropPath: c.backdropPath, releaseDate: c.releaseDate,
      rating: c.rating, mediaType: c.mediaType as 'movie' | 'tv', maturityRating: c.maturityRating,
      trailerKey: c.trailerKey ?? undefined, isFeatured: c.isFeatured,
      genres: c.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
      runtime: c.runtime ?? undefined, seasons: c.seasons ?? undefined,
      status: c.status as import('@netflix/types').ContentStatus,
      language: c.language,
      cast: c.cast,
    }
  }

  return {
    featured: mapContent(featuredContent),
    rows: rows.map((row) => ({
      id: row.id,
      title: row.title,
      items: row.contents.map((cr) => mapContent(cr.content)!).filter(Boolean),
    })),
  }
}

export default async function BrowsePage() {
  const { featured, rows } = await getBrowseData()

  return (
    <>
      <HeroBanner content={featured} />
      <div className="relative z-10 -mt-32 pb-20 space-y-8">
        <ContinueWatchingRow />
        {rows.map((row) => (
          <MovieRow key={row.id} title={row.title} items={row.items} />
        ))}
        {rows.length === 0 && (
          <div className="text-center py-32 text-netflix-light-gray">
            <p className="text-xl">No content yet.</p>
            <p className="mt-2 text-sm">Add your TMDB API key and run <code className="bg-netflix-medium-gray px-2 py-0.5 rounded">pnpm db:seed</code> to populate content.</p>
          </div>
        )}
      </div>
    </>
  )
}
