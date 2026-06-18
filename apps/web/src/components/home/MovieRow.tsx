'use client'
import { useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { MovieRowItem } from './MovieRowItem'
import type { ContentItem } from '@netflix/types'

interface MovieRowProps {
  title: string
  items: ContentItem[]
}

export function MovieRow({ title, items }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)

  if (!items.length) return null

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return
    const amount = rowRef.current.clientWidth * 0.75
    rowRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  const onScroll = () => {
    if (!rowRef.current) return
    setShowLeft(rowRef.current.scrollLeft > 20)
  }

  return (
    <div className="group/row space-y-2.5">
      <h2 className="px-4 md:px-16 text-base md:text-xl font-bold tracking-tight flex items-center gap-2">
        {title}
        <FiChevronRight className="text-sm text-netflix-red opacity-0 -translate-x-2 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300" />
      </h2>
      <div className="relative">
        {/* Left chevron */}
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 items-center justify-center w-12 bg-gradient-to-r from-netflix-black via-netflix-black/70 to-transparent opacity-0 group-hover/row:opacity-100 transition hover:from-black"
            aria-label="Scroll left"
          >
            <FiChevronLeft className="text-3xl drop-shadow-lg transition-transform hover:scale-125" />
          </button>
        )}

        {/* Row */}
        <div
          ref={rowRef}
          onScroll={onScroll}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-16 py-2"
        >
          {items.map((item) => (
            <MovieRowItem key={item.id} content={item} />
          ))}
        </div>

        {/* Right chevron */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 items-center justify-center w-12 bg-gradient-to-l from-netflix-black via-netflix-black/70 to-transparent opacity-0 group-hover/row:opacity-100 transition hover:from-black"
          aria-label="Scroll right"
        >
          <FiChevronRight className="text-3xl drop-shadow-lg transition-transform hover:scale-125" />
        </button>
      </div>
    </div>
  )
}
