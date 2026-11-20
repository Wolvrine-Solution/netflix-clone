import { db } from '@netflix/db'
import { MovieRow } from '@/components/home/MovieRow'
import type { ContentItem } from '@netflix/types'

export const dynamic = 'force-dynamic'

async function getMovies() {
  const contents = await db.query.content.findMany({
    where: (c, { eq }) => eq(c.mediaType, 'movie'),
    with: { genres: { with: { genre: true } } },
    orderBy: (c, { desc }) => desc(c.rating),
  })
  return contents.map((c): ContentItem => ({
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
    <div className="space-y-8 pb-20 pt-24">
      <h1 className="px-4 text-3xl font-bold md:px-16">Movies</h1>
      <MovieRow title="All Movies" items={movies.slice(0, 20)} />
      {Object.entries(byGenre)
        .slice(0, 6)
        .map(([genre, items]) => (
          <MovieRow key={genre} title={genre} items={items} />
        ))}
    </div>
  )
}
