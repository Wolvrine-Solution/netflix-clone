'use client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiPlay, FiPlus, FiCheck, FiThumbsUp } from 'react-icons/fi'
import { Button, Badge } from '@netflix/ui'
import { useModalStore } from '@/store/useModalStore'
import { useMyList } from '@/hooks/useMyList'
import { formatRuntime, getReleaseYear, truncate } from '@/lib/utils'

export function ContentModal() {
  const { isOpen, content, closeModal } = useModalStore()
  const { isInList, toggle } = useMyList()
  const router = useRouter()

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

              {/* Buttons overlay */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="flex items-center gap-2"
                  onClick={() => { closeModal(); router.push(`/watch/${content.id}`) }}
                >
                  <FiPlay /> Play
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
              <div className="flex gap-6">
                {/* Left column */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <span className="text-green-400 font-semibold">{Math.round(content.rating * 10)}% Match</span>
                    <span className="text-netflix-light-gray">{getReleaseYear(content.releaseDate)}</span>
                    {content.runtime && <span className="text-netflix-light-gray">{formatRuntime(content.runtime)}</span>}
                    {content.seasons && <span className="text-netflix-light-gray">{content.seasons} Season{content.seasons > 1 ? 's' : ''}</span>}
                    <Badge variant="maturity">{content.maturityRating}</Badge>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{truncate(content.description, 300)}</p>
                </div>

                {/* Right column */}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
