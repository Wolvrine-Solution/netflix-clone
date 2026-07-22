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
      <h2 className="flex items-center gap-2 px-4 text-base font-bold tracking-tight md:px-16 md:text-xl">
        {title}
        <FiChevronRight className="text-netflix-red -translate-x-2 text-sm opacity-0 transition-all duration-300 group-hover/row:translate-x-0 group-hover/row:opacity-100" />
      </h2>
      <div className="relative">
        {/* Left chevron */}
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="from-netflix-black via-netflix-black/70 absolute bottom-0 left-0 top-0 z-20 hidden w-12 items-center justify-center bg-gradient-to-r to-transparent opacity-0 transition hover:from-black group-hover/row:opacity-100 md:flex"
            aria-label="Scroll left"
          >
            <FiChevronLeft className="text-3xl drop-shadow-lg transition-transform hover:scale-125" />
          </button>
        )}

        {/* Row */}
        <div
          ref={rowRef}
          onScroll={onScroll}
          className="scrollbar-hide flex gap-2 overflow-x-auto scroll-smooth px-4 py-2 md:gap-3 md:px-16"
        >
          {items.map((item) => (
            <MovieRowItem key={item.id} content={item} />
          ))}
        </div>

        {/* Right chevron */}
        <button
          onClick={() => scroll('right')}
          className="from-netflix-black via-netflix-black/70 absolute bottom-0 right-0 top-0 z-20 hidden w-12 items-center justify-center bg-gradient-to-l to-transparent opacity-0 transition hover:from-black group-hover/row:opacity-100 md:flex"
          aria-label="Scroll right"
        >
          <FiChevronRight className="text-3xl drop-shadow-lg transition-transform hover:scale-125" />
        </button>
      </div>
    </div>
  )
}
