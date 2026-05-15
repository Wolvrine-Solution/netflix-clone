'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiPlay, FiPlus, FiCheck, FiThumbsUp, FiChevronDown } from 'react-icons/fi'
import { useModalStore } from '@/store/useModalStore'
import { useMyList } from '@/hooks/useMyList'
import { getReleaseYear, formatRuntime } from '@/lib/utils'
import type { ContentItem } from '@netflix/types'

interface MovieRowItemProps {
  content: ContentItem
}

export function MovieRowItem({ content }: MovieRowItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const { openModal } = useModalStore()
  const { isInList, toggle } = useMyList()
  const router = useRouter()

  const handleMouseEnter = () => {
    const timer = setTimeout(() => setIsHovered(true), 300)
    setHoverTimeout(timer)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    setIsHovered(false)
  }

  const inList = isInList(content.id)

  return (
    <motion.div
      className="relative shrink-0 w-36 sm:w-44 md:w-52 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ zIndex: isHovered ? 20 : 0 }}
    >
      {/* Poster */}
      <motion.div
        animate={isHovered ? { scale: 1.3, y: -20 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="origin-bottom"
      >
        <img
          src={content.posterPath || content.backdropPath}
          alt={content.title}
          className="w-full aspect-video object-cover rounded"
          loading="lazy"
        />

        {/* Hover Overlay */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-0 left-0 right-0 bg-netflix-dark-gray rounded-b shadow-2xl p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/watch/${content.id}`)}
                className="bg-white text-black rounded-full p-1.5 hover:bg-white/80 transition"
              >
                <FiPlay className="text-sm" />
              </button>
              <button
                onClick={() => toggle(content.id)}
                className="border-2 border-netflix-light-gray text-white rounded-full p-1.5 hover:border-white transition"
              >
                {inList ? <FiCheck className="text-sm" /> : <FiPlus className="text-sm" />}
              </button>
              <button className="border-2 border-netflix-light-gray text-white rounded-full p-1.5 hover:border-white transition">
                <FiThumbsUp className="text-sm" />
              </button>
              <button
                onClick={() => openModal(content)}
                className="ml-auto border-2 border-netflix-light-gray text-white rounded-full p-1.5 hover:border-white transition"
              >
                <FiChevronDown className="text-sm" />
              </button>
            </div>
            <p className="font-semibold text-xs leading-tight">{content.title}</p>
            <div className="flex items-center gap-2 text-xs text-netflix-light-gray">
              <span className="text-green-400 font-semibold">{Math.round(content.rating * 10)}%</span>
              {content.runtime && <span>{formatRuntime(content.runtime)}</span>}
              {content.seasons && <span>{content.seasons}S</span>}
              <span className="border border-netflix-light-gray text-xs px-0.5">{content.maturityRating}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {content.genres.slice(0, 2).map((g, i) => (
                <span key={g.id} className="text-xs text-netflix-light-gray">
                  {g.name}{i < Math.min(content.genres.length, 2) - 1 ? ' •' : ''}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
