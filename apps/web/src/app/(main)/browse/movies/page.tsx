import { prisma } from '@netflix/db'
import { MovieRow } from '@/components/home/MovieRow'
import type { ContentItem } from '@netflix/types'

async function getMovies() {
  const contents = await prisma.content.findMany({
    where: { mediaType: 'movie' },
    include: { genres: { include: { genre: true } } },
    orderBy: { rating: 'desc' },
  })
  return contents.map((c): ContentItem => ({
    id: c.id, tmdbId: c.tmdbId ?? undefined, title: c.title, description: c.description,
    posterPath: c.posterPath, backdropPath: c.backdropPath, releaseDate: c.releaseDate,
    rating: c.rating, mediaType: c.mediaType as 'movie' | 'tv', maturityRating: c.maturityRating,
    trailerKey: c.trailerKey ?? undefined, isFeatured: c.isFeatured,
    genres: c.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
    runtime: c.runtime ?? undefined,
    status: c.status as import('@netflix/types').ContentStatus,
    language: c.language,
    cast: c.cast,
  }))
}

export default async function MoviesPage() {
  const movies = await getMovies()
  const byGenre = movies.reduce<Record<string, ContentItem[]>>((acc, movie) => {
    const genre = movie.genres[0]?.name ?? 'Other'
    if (!acc[genre]) acc[genre] = []
    acc[genre].push(movie)
    return acc
  }, {})

  return (
    <div className="pt-24 pb-20 space-y-8">
      <h1 className="px-4 md:px-16 text-3xl font-bold">Movies</h1>
      <MovieRow title="All Movies" items={movies.slice(0, 20)} />
      {Object.entries(byGenre).slice(0, 6).map(([genre, items]) => (
        <MovieRow key={genre} title={genre} items={items} />
      ))}
    </div>
  )
}
