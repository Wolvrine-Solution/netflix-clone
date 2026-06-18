import { prisma } from '@netflix/db'
import { MovieRow } from '@/components/home/MovieRow'
import type { ContentItem } from '@netflix/types'

async function getTVShows() {
  const contents = await prisma.content.findMany({
    where: { mediaType: 'tv' },
    include: { genres: { include: { genre: true } } },
    orderBy: { rating: 'desc' },
  })
  return contents.map((c): ContentItem => ({
    id: c.id, tmdbId: c.tmdbId ?? undefined, title: c.title, description: c.description,
    posterPath: c.posterPath, backdropPath: c.backdropPath, releaseDate: c.releaseDate,
    rating: c.rating, mediaType: c.mediaType as 'movie' | 'tv', maturityRating: c.maturityRating,
    trailerKey: c.trailerKey ?? undefined, isFeatured: c.isFeatured,
    genres: c.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
    seasons: c.seasons ?? undefined, episodes: c.episodes ?? undefined,
    status: c.status as import('@netflix/types').ContentStatus,
    language: c.language,
    cast: c.cast,
  }))
}

export default async function TVPage() {
  const shows = await getTVShows()

  return (
    <div className="pt-24 pb-20 space-y-8">
      <h1 className="px-4 md:px-16 text-3xl font-bold">TV Shows</h1>
      <MovieRow title="All TV Shows" items={shows.slice(0, 20)} />
    </div>
  )
}
