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
      className="relative w-36 shrink-0 cursor-pointer sm:w-44 md:w-52"
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
            className="aspect-video w-full object-cover"
            loading="lazy"
          />
          {!isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition hover:opacity-100" />
          )}
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong shadow-card-hover absolute left-0 right-0 top-[calc(100%-6px)] space-y-2 rounded-b-lg p-3"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/watch/${content.id}`)}
                className="rounded-full bg-white p-2 text-black transition hover:scale-110 hover:bg-white/80 active:scale-95"
              >
                <FiPlay className="text-sm" />
              </button>
              <button
                onClick={() => toggle(content.id)}
                className="rounded-full border-2 border-white/40 p-2 text-white transition hover:scale-110 hover:border-white active:scale-95"
              >
                {inList ? <FiCheck className="text-sm" /> : <FiPlus className="text-sm" />}
              </button>
              <button className="rounded-full border-2 border-white/40 p-2 text-white transition hover:scale-110 hover:border-white active:scale-95">
                <FiThumbsUp className="text-sm" />
              </button>
              <button
                onClick={() => openModal(content)}
                className="ml-auto rounded-full border-2 border-white/40 p-2 text-white transition hover:scale-110 hover:border-white active:scale-95"
              >
                <FiChevronDown className="text-sm" />
              </button>
            </div>
            <p className="text-xs font-semibold leading-tight">{content.title}</p>
            <div className="text-netflix-light-gray flex items-center gap-2 text-xs">
              <span className="font-semibold text-green-400">
                {Math.round(content.rating * 10)}%
              </span>
              {content.runtime && <span>{formatRuntime(content.runtime)}</span>}
              {content.seasons && <span>{content.seasons}S</span>}
              <span className="border-netflix-light-gray border px-0.5 text-xs">
                {content.maturityRating}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {content.genres.slice(0, 2).map((g, i) => (
                <span key={g.id} className="text-netflix-light-gray text-xs">
                  {g.name}
                  {i < Math.min(content.genres.length, 2) - 1 ? ' •' : ''}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
