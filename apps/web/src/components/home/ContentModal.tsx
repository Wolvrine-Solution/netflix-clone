'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPlay, FiPlus, FiCheck, FiThumbsUp } from 'react-icons/fi'
import { Button, Badge } from '@netflix/ui'
import { useModalStore } from '@/store/useModalStore'
import { useMyList } from '@/hooks/useMyList'
import { formatRuntime, getReleaseYear, truncate } from '@/lib/utils'
import { api } from '@/lib/api'

interface Episode {
  id: string
  episodeNumber: number
  title: string
  runtime?: number | null
  stillPath?: string | null
}
interface Season {
  id: string
  seasonNumber: number
  title?: string | null
  episodes: Episode[]
}

export function ContentModal() {
  const { isOpen, content, closeModal } = useModalStore()
  const { isInList, toggle } = useMyList()
  const router = useRouter()

  const [tab, setTab] = useState<'info' | 'episodes'>('info')
  const [seasons, setSeasons] = useState<Season[]>([])
  const [activeSeason, setActiveSeason] = useState(1)
  const [loadingSeasons, setLoadingSeasons] = useState(false)

  useEffect(() => {
    if (!isOpen || !content || content.mediaType !== 'tv') {
      setSeasons([])
      setTab('info')
      return
    }
    setLoadingSeasons(true)
    api
      .content(content.id)
      .then((res) => {
        const data = (res.data as { data?: { contentSeasons?: Season[] } }).data
        const s = data?.contentSeasons ?? []
        setSeasons(s)
        if (s.length > 0) setActiveSeason(s[0]!.seasonNumber)
      })
      .catch(() => {})
      .finally(() => setLoadingSeasons(false))
  }, [isOpen, content])

  const currentSeason = seasons.find((s) => s.seasonNumber === activeSeason)

  return (
    <AnimatePresence>
      {isOpen && content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal — slides up on mobile, scales in on desktop */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="bg-netflix-card relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl shadow-[0_32px_80px_rgba(0,0,0,0.9)] ring-1 ring-white/5 sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
          >
            {/* Hero Image / Trailer */}
            <div className="relative aspect-video">
              {content.trailerKey ? (
                <iframe
                  src={`https://www.youtube.com/embed/${content.trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                  className="h-full w-full"
                  allow="autoplay"
                  title="Trailer"
                />
              ) : (
                <img
                  src={content.backdropPath || content.posterPath}
                  alt={content.title}
                  className="h-full w-full object-cover"
                />
              )}
              {/* Scrim so action buttons stay readable */}
              <div className="from-netflix-card via-netflix-card/60 absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t to-transparent" />

              {/* Close button */}
              <button
                onClick={closeModal}
                className="glass absolute right-4 top-4 rounded-full p-2 transition hover:bg-white/20"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>

              {/* Pull indicator on mobile */}
              <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/30 sm:hidden" />

              {/* Action buttons pinned over hero bottom */}
              <div className="absolute bottom-5 left-6 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="shadow-card flex items-center gap-2 !rounded-xl transition-transform hover:scale-[1.04] active:scale-95"
                  onClick={() => {
                    closeModal()
                    router.push(`/watch/${content.id}`)
                  }}
                >
                  <FiPlay /> {content.mediaType === 'tv' ? 'Play S1:E1' : 'Play'}
                </Button>
                <button
                  onClick={() => toggle(content.id)}
                  className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/40 text-white transition hover:scale-110 hover:border-white active:scale-95"
                  aria-label={isInList(content.id) ? 'Remove from list' : 'Add to list'}
                >
                  {isInList(content.id) ? <FiCheck /> : <FiPlus />}
                </button>
                <button
                  className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/40 text-white transition hover:scale-110 hover:border-white active:scale-95"
                  aria-label="Rate"
                >
                  <FiThumbsUp />
                </button>
              </div>
            </div>

            {/* Content Info */}
            <div className="space-y-5 p-6">
              {/* Title + meta */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black leading-tight">{content.title}</h2>
                <div className="flex flex-wrap items-center gap-2.5 text-sm">
                  <span className="font-bold text-green-400">
                    {Math.round(content.rating * 10)}% Match
                  </span>
                  <span className="text-netflix-light-gray">
                    {getReleaseYear(content.releaseDate)}
                  </span>
                  {content.runtime && (
                    <span className="text-netflix-light-gray">
                      {formatRuntime(content.runtime)}
                    </span>
                  )}
                  {content.seasons && (
                    <span className="text-netflix-light-gray">
                      {content.seasons} Season{content.seasons > 1 ? 's' : ''}
                    </span>
                  )}
                  <Badge variant="maturity">{content.maturityRating}</Badge>
                </div>
              </div>

              {/* Tabs (TV only) */}
              {content.mediaType === 'tv' && (
                <div className="flex gap-1 border-b border-white/10">
                  {(['info', 'episodes'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`-mb-px border-b-2 px-5 py-2.5 text-sm font-semibold capitalize transition ${
                        tab === t
                          ? 'border-netflix-red text-white'
                          : 'text-netflix-muted border-transparent hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Info Tab */}
              {tab === 'info' && (
                <div className="flex flex-col gap-6 md:flex-row">
                  <p className="flex-1 text-sm leading-relaxed text-white/75">
                    {truncate(content.description, 300)}
                  </p>
                  <div className="text-netflix-light-gray shrink-0 space-y-2 text-xs md:w-44">
                    <div>
                      <span className="font-medium text-white">Genres: </span>
                      {content.genres.map((g) => g.name).join(', ')}
                    </div>
                    <div>
                      <span className="font-medium text-white">Maturity: </span>
                      {content.maturityRating}
                    </div>
                  </div>
                </div>
              )}

              {/* Episodes Tab */}
              {tab === 'episodes' && (
                <div className="space-y-4">
                  {/* Season selector */}
                  {seasons.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {seasons.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setActiveSeason(s.seasonNumber)}
                          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                            activeSeason === s.seasonNumber
                              ? 'bg-white text-black'
                              : 'bg-netflix-medium-gray text-netflix-light-gray hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          Season {s.seasonNumber}
                        </button>
                      ))}
                    </div>
                  )}

                  {loadingSeasons ? (
                    <div className="space-y-3 py-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <div className="skeleton aspect-video w-24 shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="skeleton h-3 w-3/4" />
                            <div className="skeleton h-2 w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : seasons.length === 0 ? (
                    <p className="text-netflix-muted py-4 text-sm">No episode data available.</p>
                  ) : (
                    <div className="space-y-1">
                      {currentSeason?.episodes.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => {
                            closeModal()
                            router.push(
                              `/watch/${content.id}?season=${activeSeason}&episode=${ep.episodeNumber}`
                            )
                          }}
                          className="hover:bg-white/8 active:bg-white/12 group flex w-full items-start gap-3 rounded-xl p-3 text-left transition"
                        >
                          {ep.stillPath ? (
                            <img
                              src={ep.stillPath}
                              alt=""
                              className="aspect-video w-24 flex-shrink-0 rounded-lg object-cover ring-1 ring-white/5"
                            />
                          ) : (
                            <div className="bg-netflix-medium-gray grid aspect-video w-24 flex-shrink-0 place-items-center rounded-lg transition group-hover:bg-white/10">
                              <FiPlay className="text-netflix-muted transition group-hover:text-white/60" />
                            </div>
                          )}
                          <div className="min-w-0 pt-1">
                            <p className="text-sm font-semibold leading-snug text-white">
                              {ep.episodeNumber}. {ep.title}
                            </p>
                            {ep.runtime && (
                              <p className="text-netflix-muted mt-0.5 text-xs">{ep.runtime}m</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
