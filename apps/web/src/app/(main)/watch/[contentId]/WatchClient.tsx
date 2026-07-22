'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { FiList, FiX, FiPlay } from 'react-icons/fi'
import { api } from '@/lib/api'
import { useProfileStore } from '@/store/useProfileStore'
import type { ContentItem } from '@netflix/types'

interface EpisodeData {
  id: string
  episodeNumber: number
  title: string
  runtime?: number | null
  stillPath?: string | null
  videoUrl?: string | null
}

interface SeasonData {
  id: string
  seasonNumber: number
  title?: string | null
  episodes: EpisodeData[]
}

interface Props {
  content: ContentItem
  videoUrl: string | null
  episodeInfo: { season: number; episode: number; title: string } | null
  seasons: SeasonData[]
  currentSeason: number
  currentEpisode: number
}

export function WatchClient({
  content,
  videoUrl,
  episodeInfo,
  seasons,
  currentSeason,
  currentEpisode,
}: Props) {
  const router = useRouter()
  const activeProfile = useProfileStore((s) => s.activeProfile)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [activeSeason, setActiveSeason] = useState(currentSeason)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(videoUrl)

  useEffect(() => {
    const season = seasons.find((s) => s.seasonNumber === currentSeason)
    const episode = season?.episodes.find((e) => e.episodeNumber === currentEpisode)
    api.playback
      .token(content.id, {
        profileId: activeProfile?.id,
        episodeId: episode?.id,
      })
      .then((res) => setPlaybackUrl(res.data.data.manifestUrl))
      .catch(() => setPlaybackUrl(videoUrl))
  }, [content.id, videoUrl, activeProfile?.id, seasons, currentSeason, currentEpisode])

  const isTVWithSeasons = content.mediaType === 'tv' && seasons.length > 0
  const currentSeasonData = seasons.find((s) => s.seasonNumber === activeSeason) ?? seasons[0]

  function goToEpisode(season: number, episode: number) {
    setShowEpisodes(false)
    router.replace(`/watch/${content.id}?season=${season}&episode=${episode}`)
  }

  function getNextEpisode() {
    if (!isTVWithSeasons) return null
    const season = seasons.find((s) => s.seasonNumber === currentSeason)
    if (!season) return null
    const idx = season.episodes.findIndex((e) => e.episodeNumber === currentEpisode)
    if (idx < season.episodes.length - 1) {
      return { season: currentSeason, episode: season.episodes[idx + 1]!.episodeNumber }
    }
    const nextSeason = seasons.find((s) => s.seasonNumber === currentSeason + 1)
    if (nextSeason && nextSeason.episodes.length > 0) {
      return { season: nextSeason.seasonNumber, episode: nextSeason.episodes[0]!.episodeNumber }
    }
    return null
  }

  function getPrevEpisode() {
    if (!isTVWithSeasons) return null
    const season = seasons.find((s) => s.seasonNumber === currentSeason)
    if (!season) return null
    const idx = season.episodes.findIndex((e) => e.episodeNumber === currentEpisode)
    if (idx > 0) {
      return { season: currentSeason, episode: season.episodes[idx - 1]!.episodeNumber }
    }
    const prevSeason = seasons.find((s) => s.seasonNumber === currentSeason - 1)
    if (prevSeason && prevSeason.episodes.length > 0) {
      const last = prevSeason.episodes[prevSeason.episodes.length - 1]!
      return { season: prevSeason.seasonNumber, episode: last.episodeNumber }
    }
    return null
  }

  const next = getNextEpisode()
  const prev = getPrevEpisode()

  return (
    <>
      <VideoPlayer
        content={content}
        videoUrl={playbackUrl}
        episodeInfo={episodeInfo}
        onNext={next ? () => goToEpisode(next.season, next.episode) : undefined}
        onPrev={prev ? () => goToEpisode(prev.season, prev.episode) : undefined}
      />

      {/* Episode List Button (TV only) */}
      {isTVWithSeasons && (
        <button
          onClick={() => setShowEpisodes(true)}
          className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          <FiList /> Episodes
        </button>
      )}

      {/* Episode Panel */}
      {showEpisodes && (
        <div className="bg-netflix-dark-gray absolute inset-y-0 right-0 z-30 flex w-80 flex-col border-l border-gray-800">
          {/* Header */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-800 p-4">
            <h3 className="font-semibold">{content.title}</h3>
            <button
              onClick={() => setShowEpisodes(false)}
              className="text-gray-500 transition hover:text-white"
            >
              <FiX />
            </button>
          </div>

          {/* Season tabs */}
          {seasons.length > 1 && (
            <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-gray-800 p-3">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSeason(s.seasonNumber)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${activeSeason === s.seasonNumber ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  S{s.seasonNumber}
                </button>
              ))}
            </div>
          )}

          {/* Episode list */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {currentSeasonData?.episodes.map((ep) => {
              const isActive = currentSeason === activeSeason && currentEpisode === ep.episodeNumber
              return (
                <button
                  key={ep.id}
                  onClick={() => goToEpisode(activeSeason, ep.episodeNumber)}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${isActive ? 'bg-netflix-red/20 border-netflix-red/40 border' : 'hover:bg-gray-800'}`}
                >
                  {ep.stillPath ? (
                    <img
                      src={ep.stillPath}
                      alt=""
                      className="aspect-video w-20 flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div
                      className={`flex aspect-video w-20 flex-shrink-0 items-center justify-center rounded ${isActive ? 'bg-netflix-red/30' : 'bg-gray-800'}`}
                    >
                      <FiPlay
                        className={`text-sm ${isActive ? 'text-netflix-red' : 'text-gray-600'}`}
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium leading-tight ${isActive ? 'text-netflix-red' : 'text-white'}`}
                    >
                      {ep.episodeNumber}. {ep.title}
                    </p>
                    {ep.runtime && <p className="mt-0.5 text-xs text-gray-500">{ep.runtime}m</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
