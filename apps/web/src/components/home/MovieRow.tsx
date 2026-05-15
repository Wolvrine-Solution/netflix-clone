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
    <div className="group/row px-4 md:px-16 space-y-2">
      <h2 className="text-sm md:text-base font-semibold tracking-wide">{title}</h2>
      <div className="relative">
        {/* Left chevron */}
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-10 bg-netflix-black/50 opacity-0 group-hover/row:opacity-100 transition hover:bg-netflix-black/80"
            aria-label="Scroll left"
          >
            <FiChevronLeft className="text-3xl" />
          </button>
        )}

        {/* Row */}
        <div
          ref={rowRef}
          onScroll={onScroll}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {items.map((item) => (
            <MovieRowItem key={item.id} content={item} />
          ))}
        </div>

        {/* Right chevron */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-10 bg-netflix-black/50 opacity-0 group-hover/row:opacity-100 transition hover:bg-netflix-black/80"
          aria-label="Scroll right"
        >
          <FiChevronRight className="text-3xl" />
        </button>
      </div>
    </div>
  )
}
