import { redirect } from 'next/navigation'
import { prisma } from '@netflix/db'
import { VideoPlayer } from '@/components/player/VideoPlayer'

interface WatchPageProps {
  params: { contentId: string }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const content = await prisma.content.findUnique({
    where: { id: params.contentId },
    include: { genres: { include: { genre: true } } },
  })

  if (!content) redirect('/browse')

  const contentItem = {
    id: content.id,
    tmdbId: content.tmdbId,
    title: content.title,
    description: content.description,
    posterPath: content.posterPath,
    backdropPath: content.backdropPath,
    releaseDate: content.releaseDate,
    rating: content.rating,
    mediaType: content.mediaType,
    genres: content.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
    maturityRating: content.maturityRating,
    trailerKey: content.trailerKey ?? undefined,
    isFeatured: content.isFeatured,
    runtime: content.runtime ?? undefined,
    seasons: content.seasons ?? undefined,
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <VideoPlayer content={contentItem} />
    </div>
  )
}
