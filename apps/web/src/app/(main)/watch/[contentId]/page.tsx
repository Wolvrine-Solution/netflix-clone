import { redirect } from 'next/navigation'
import { prisma } from '@netflix/db'
import { WatchClient } from './WatchClient'
import type { ContentItem } from '@netflix/types'

interface WatchPageProps {
  params: { contentId: string }
  searchParams: { season?: string; episode?: string }
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { contentId } = params
  const seasonNum = parseInt(searchParams.season ?? '1')
  const episodeNum = parseInt(searchParams.episode ?? '1')

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: {
      genres: { include: { genre: true } },
      videoFiles: { orderBy: { isDefault: 'desc' } },
      contentSeasons: {
        orderBy: { seasonNumber: 'asc' },
        include: {
          episodes: {
            orderBy: { episodeNumber: 'asc' },
            include: { videoFiles: { orderBy: { isDefault: 'desc' } } },
          },
        },
      },
    },
  })

  if (!content) redirect('/browse')

  const contentItem: ContentItem = {
    id: content.id,
    tmdbId: content.tmdbId ?? undefined,
    title: content.title,
    description: content.description,
    posterPath: content.posterPath,
    backdropPath: content.backdropPath,
    releaseDate: content.releaseDate,
    rating: content.rating,
    mediaType: content.mediaType as 'movie' | 'tv',
    maturityRating: content.maturityRating,
    trailerKey: content.trailerKey ?? undefined,
    isFeatured: content.isFeatured,
    genres: content.genres.map((cg) => ({ id: cg.genre.id, name: cg.genre.name })),
    runtime: content.runtime ?? undefined,
    seasons:
      content.contentSeasons.length > 0
        ? content.contentSeasons.length
        : (content.seasons ?? undefined),
    status: content.status as import('@netflix/types').ContentStatus,
    language: content.language,
    cast: content.cast,
  }

  let videoUrl: string | null = content.videoUrl ?? null
  let episodeInfo: { season: number; episode: number; title: string } | null = null

  if (content.mediaType === 'tv' && content.contentSeasons.length > 0) {
    const season =
      content.contentSeasons.find((s) => s.seasonNumber === seasonNum) ?? content.contentSeasons[0]
    const episode =
      season?.episodes.find((e) => e.episodeNumber === episodeNum) ?? season?.episodes[0]
    if (episode) {
      videoUrl = episode.videoFiles[0]?.url ?? episode.videoUrl ?? videoUrl
      episodeInfo = {
        season: season!.seasonNumber,
        episode: episode.episodeNumber,
        title: episode.title,
      }
    }
  } else if (content.videoFiles.length > 0) {
    videoUrl = content.videoFiles[0]?.url ?? videoUrl
  }

  const seasonsData = content.contentSeasons.map((s) => ({
    id: s.id,
    seasonNumber: s.seasonNumber,
    title: s.title,
    episodes: s.episodes.map((e) => ({
      id: e.id,
      episodeNumber: e.episodeNumber,
      title: e.title,
      runtime: e.runtime,
      stillPath: e.stillPath,
      videoUrl: e.videoFiles[0]?.url ?? e.videoUrl,
    })),
  }))

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <WatchClient
        content={contentItem}
        videoUrl={videoUrl}
        episodeInfo={episodeInfo}
        seasons={seasonsData}
        currentSeason={seasonNum}
        currentEpisode={episodeNum}
      />
    </div>
  )
}
