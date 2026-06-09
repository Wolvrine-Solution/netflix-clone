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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-netflix-dark-gray shadow-2xl"
          >
            {/* Hero Image */}
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
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-netflix-dark-gray to-transparent" />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-netflix-dark-gray rounded-full p-2 hover:bg-netflix-medium-gray transition"
              >
                <FiX className="text-xl" />
              </button>

              {/* Action buttons overlay */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="flex items-center gap-2"
                  onClick={() => { closeModal(); router.push(`/watch/${content.id}`) }}
                >
                  <FiPlay /> {content.mediaType === 'tv' ? 'Play S1:E1' : 'Play'}
                </Button>
                <button
                  onClick={() => toggle(content.id)}
                  className="border-2 border-netflix-light-gray text-white rounded-full p-2 hover:border-white transition"
                >
                  {isInList(content.id) ? <FiCheck /> : <FiPlus />}
                </button>
                <button className="border-2 border-netflix-light-gray text-white rounded-full p-2 hover:border-white transition">
                  <FiThumbsUp />
                </button>
              </div>
            </div>

            {/* Content Info */}
            <div className="p-6 space-y-4">
              {/* Meta row */}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="text-green-400 font-semibold">{Math.round(content.rating * 10)}% Match</span>
                <span className="text-netflix-light-gray">{getReleaseYear(content.releaseDate)}</span>
                {content.runtime && <span className="text-netflix-light-gray">{formatRuntime(content.runtime)}</span>}
                {content.seasons && <span className="text-netflix-light-gray">{content.seasons} Season{content.seasons > 1 ? 's' : ''}</span>}
                <Badge variant="maturity">{content.maturityRating}</Badge>
              </div>

              {/* Tabs (TV only) */}
              {content.mediaType === 'tv' && (
                <div className="flex gap-1 border-b border-gray-700">
                  {(['info', 'episodes'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition -mb-[1px] ${tab === t ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Info Tab */}
              {tab === 'info' && (
                <div className="flex gap-6">
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-gray-300 leading-relaxed">{truncate(content.description, 300)}</p>
                  </div>
                  <div className="w-44 space-y-2 text-xs text-netflix-light-gray">
                    <div>
                      <span className="text-white">Genres: </span>
                      {content.genres.map((g) => g.name).join(', ')}
                    </div>
                    <div>
                      <span className="text-white">Maturity: </span>
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeSeason === s.seasonNumber ? 'bg-white text-black' : 'bg-netflix-medium-gray text-gray-400 hover:bg-gray-700'}`}
                        >
                          Season {s.seasonNumber}
                        </button>
                      ))}
                    </div>
                  )}

                  {loadingSeasons ? (
                    <p className="text-gray-500 text-sm py-4 text-center">Loading episodes…</p>
                  ) : seasons.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4">No episode data available.</p>
                  ) : (
                    <div className="space-y-2">
                      {currentSeason?.episodes.map((ep) => (
                        <button
                          key={ep.id}
                          onClick={() => {
                            closeModal()
                            router.push(`/watch/${content.id}?season=${activeSeason}&episode=${ep.episodeNumber}`)
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-netflix-medium-gray transition text-left group"
                        >
                          {ep.stillPath ? (
                            <img src={ep.stillPath} alt="" className="w-24 aspect-video object-cover rounded flex-shrink-0" />
                          ) : (
                            <div className="w-24 aspect-video bg-gray-800 rounded flex-shrink-0 flex items-center justify-center group-hover:bg-gray-700 transition">
                              <FiPlay className="text-gray-600 group-hover:text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 pt-1">
                            <p className="text-sm font-medium text-white">
                              {ep.episodeNumber}. {ep.title}
                            </p>
                            {ep.runtime && <p className="text-xs text-gray-500 mt-0.5">{ep.runtime}m</p>}
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
