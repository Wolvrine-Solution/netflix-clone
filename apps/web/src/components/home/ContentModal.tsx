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

interface Episode { id: string; episodeNumber: number; title: string; runtime?: number | null; stillPath?: string | null }
interface Season { id: string; seasonNumber: number; title?: string | null; episodes: Episode[] }

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
    api.content(content.id)
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal — slides up on mobile, scales in on desktop */}
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-netflix-card shadow-[0_32px_80px_rgba(0,0,0,0.9)] ring-1 ring-white/5"
          >
            {/* Hero Image / Trailer */}
            <div className="relative aspect-video">
              {content.trailerKey ? (
                <iframe
                  src={`https://www.youtube.com/embed/${content.trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                  className="w-full h-full"
                  allow="autoplay"
                  title="Trailer"
                />
              ) : (
                <img
                  src={content.backdropPath || content.posterPath}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Scrim so action buttons stay readable */}
              <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-netflix-card via-netflix-card/60 to-transparent" />

              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 glass rounded-full p-2 hover:bg-white/20 transition"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>

              {/* Pull indicator on mobile */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-white/30 sm:hidden" />

              {/* Action buttons pinned over hero bottom */}
              <div className="absolute bottom-5 left-6 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="flex items-center gap-2 !rounded-xl shadow-card hover:scale-[1.04] active:scale-95 transition-transform"
                  onClick={() => { closeModal(); router.push(`/watch/${content.id}`) }}
                >
                  <FiPlay /> {content.mediaType === 'tv' ? 'Play S1:E1' : 'Play'}
                </Button>
                <button
                  onClick={() => toggle(content.id)}
                  className="grid place-items-center w-10 h-10 border-2 border-white/40 rounded-full text-white hover:border-white hover:scale-110 active:scale-95 transition"
                  aria-label={isInList(content.id) ? 'Remove from list' : 'Add to list'}
                >
                  {isInList(content.id) ? <FiCheck /> : <FiPlus />}
                </button>
                <button
                  className="grid place-items-center w-10 h-10 border-2 border-white/40 rounded-full text-white hover:border-white hover:scale-110 active:scale-95 transition"
                  aria-label="Rate"
                >
                  <FiThumbsUp />
                </button>
              </div>
            </div>

            {/* Content Info */}
            <div className="p-6 space-y-5">
              {/* Title + meta */}
              <div className="space-y-2">
                <h2 className="text-2xl font-black leading-tight">{content.title}</h2>
                <div className="flex items-center gap-2.5 text-sm flex-wrap">
                  <span className="text-green-400 font-bold">{Math.round(content.rating * 10)}% Match</span>
                  <span className="text-netflix-light-gray">{getReleaseYear(content.releaseDate)}</span>
                  {content.runtime && <span className="text-netflix-light-gray">{formatRuntime(content.runtime)}</span>}
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
                      className={`px-5 py-2.5 text-sm font-semibold capitalize border-b-2 transition -mb-px ${
                        tab === t
                          ? 'border-netflix-red text-white'
                          : 'border-transparent text-netflix-muted hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Info Tab */}
              {tab === 'info' && (
                <div className="flex flex-col md:flex-row gap-6">
                  <p className="flex-1 text-sm text-white/75 leading-relaxed">
                    {truncate(content.description, 300)}
                  </p>
                  <div className="md:w-44 space-y-2 text-xs text-netflix-light-gray shrink-0">
                    <div>
                      <span className="text-white font-medium">Genres: </span>
                      {content.genres.map((g) => g.name).join(', ')}
                    </div>
                    <div>
                      <span className="text-white font-medium">Maturity: </span>
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
                    <div className="flex gap-2 flex-wrap">
                      {seasons.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setActiveSeason(s.seasonNumber)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
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
                          <div className="skeleton w-24 aspect-video shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="skeleton h-3 w-3/4" />
                            <div className="skeleton h-2 w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : seasons.length === 0 ? (
                    <p className="text-netflix-muted text-sm py-4">No episode data available.</p>
                  ) : (
                    <div className="space-y-1">
                      {currentSeason?.episodes.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => {
                            closeModal()
                            router.push(`/watch/${content.id}?season=${activeSeason}&episode=${ep.episodeNumber}`)
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-white/8 active:bg-white/12 transition text-left group"
                        >
                          {ep.stillPath ? (
                            <img
                              src={ep.stillPath}
                              alt=""
                              className="w-24 aspect-video object-cover rounded-lg flex-shrink-0 ring-1 ring-white/5"
                            />
                          ) : (
                            <div className="w-24 aspect-video bg-netflix-medium-gray rounded-lg flex-shrink-0 grid place-items-center group-hover:bg-white/10 transition">
                              <FiPlay className="text-netflix-muted group-hover:text-white/60 transition" />
                            </div>
                          )}
                          <div className="min-w-0 pt-1">
                            <p className="text-sm font-semibold text-white leading-snug">
                              {ep.episodeNumber}. {ep.title}
                            </p>
                            {ep.runtime && (
                              <p className="text-xs text-netflix-muted mt-0.5">{ep.runtime}m</p>
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
