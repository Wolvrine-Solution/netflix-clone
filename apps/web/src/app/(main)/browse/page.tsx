import { db } from '@netflix/db'
import { HeroBanner } from '@/components/home/HeroBanner'
import { MovieRow } from '@/components/home/MovieRow'
import { ContinueWatchingRow } from '@/components/home/ContinueWatchingRow'
import type { ContentItem, BrowseRow } from '@netflix/types'

export const dynamic = 'force-dynamic'

async function getBrowseData(): Promise<{ featured: ContentItem | null; rows: BrowseRow[] }> {
  const [featuredContent, rows] = await Promise.all([
    db.query.content.findFirst({
      where: (c, { eq }) => eq(c.isFeatured, true),
      with: { genres: { with: { genre: true } } },
    }),
    db.query.row.findMany({
      orderBy: (r, { asc }) => asc(r.order),
      with: {
        contents: {
          orderBy: (cr, { asc }) => asc(cr.order),
          limit: 20,
          with: { content: { with: { genres: { with: { genre: true } } } } },
        },
      },
    }),
  ])

  const mapContent = (c: typeof featuredContent | undefined | null): ContentItem | null => {
    if (!c) return null
    return {
      id: c.id,
      tmdbId: c.tmdbId ?? undefined,
      title: c.title,
      description: c.description,
      posterPath: c.posterPath,
      backdropPath: c.backdropPath,
      releaseDate: c.releaseDate,
      rating: c.rating,
      mediaType: c.mediaType as 'movie' | 'tv',
      maturityRating: c.maturityRating,
      trailerKey: c.trailerKey ?? undefined,
      isFeatured: c.isFeatured,
      genres: c.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
      runtime: c.runtime ?? undefined,
      seasons: c.seasons ?? undefined,
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
      <div className="relative z-10 -mt-32 space-y-8 pb-20">
        <ContinueWatchingRow />
        {rows.map((row) => (
          <MovieRow key={row.id} title={row.title} items={row.items} />
        ))}
        {rows.length === 0 && (
          <div className="text-netflix-light-gray py-32 text-center">
            <p className="text-xl">No content yet.</p>
            <p className="mt-2 text-sm">
              Add your TMDB API key and run{' '}
              <code className="bg-netflix-medium-gray rounded px-2 py-0.5">pnpm db:seed</code> to
              populate content.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
