import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-16 w-16' }

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`border-netflix-light-gray border-t-netflix-red animate-spin rounded-full border-2 ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
