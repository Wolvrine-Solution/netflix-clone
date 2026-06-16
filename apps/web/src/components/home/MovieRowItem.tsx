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
        animate={isHovered ? { scale: 1.28, y: -24 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`origin-bottom rounded-lg ${isHovered ? 'shadow-card-hover' : 'shadow-card'}`}
      >
        <div className="relative overflow-hidden rounded-lg ring-1 ring-white/5">
          <img
            src={content.posterPath || content.backdropPath}
            alt={content.title}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          {!isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition" />
          )}
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[calc(100%-6px)] left-0 right-0 glass-strong rounded-b-lg shadow-card-hover p-3 space-y-2"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/watch/${content.id}`)}
                className="bg-white text-black rounded-full p-2 hover:bg-white/80 hover:scale-110 active:scale-95 transition"
              >
                <FiPlay className="text-sm" />
              </button>
              <button
                onClick={() => toggle(content.id)}
                className="border-2 border-white/40 text-white rounded-full p-2 hover:border-white hover:scale-110 active:scale-95 transition"
              >
                {inList ? <FiCheck className="text-sm" /> : <FiPlus className="text-sm" />}
              </button>
              <button className="border-2 border-white/40 text-white rounded-full p-2 hover:border-white hover:scale-110 active:scale-95 transition">
                <FiThumbsUp className="text-sm" />
              </button>
              <button
                onClick={() => openModal(content)}
                className="ml-auto border-2 border-white/40 text-white rounded-full p-2 hover:border-white hover:scale-110 active:scale-95 transition"
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
