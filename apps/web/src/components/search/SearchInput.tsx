'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FiSearch, FiX } from 'react-icons/fi'
import { cn } from '@/lib/utils'

export function SearchInput() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleOpen = () => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <div
        className={cn(
          'flex items-center gap-2 border transition-all duration-300 overflow-hidden',
          isOpen
            ? 'border-white bg-black/80 px-3 py-1.5 w-48 md:w-64'
            : 'border-transparent w-8'
        )}
      >
        <button type={isOpen ? 'submit' : 'button'} onClick={!isOpen ? handleOpen : undefined}>
          <FiSearch className="text-lg shrink-0 cursor-pointer hover:text-netflix-light-gray transition" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titles, people, genres"
          className={cn(
            'bg-transparent text-sm text-white placeholder-netflix-light-gray outline-none transition-all duration-300',
            isOpen ? 'w-full opacity-100' : 'w-0 opacity-0'
          )}
        />
        {isOpen && (
          <button type="button" onClick={handleClose}>
            <FiX className="text-netflix-light-gray hover:text-white shrink-0" />
          </button>
        )}
      </div>
    </form>
  )
}
