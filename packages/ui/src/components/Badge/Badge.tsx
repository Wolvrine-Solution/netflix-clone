import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'maturity' | 'genre' | 'default'
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClass =
    variant === 'maturity'
      ? 'border border-netflix-light-gray text-netflix-light-gray text-xs px-1'
      : variant === 'genre'
        ? 'bg-netflix-medium-gray text-white text-xs px-2 py-0.5 rounded'
        : 'bg-netflix-red text-white text-xs px-2 py-0.5 rounded'

  return <span className={`inline-flex items-center ${variantClass} ${className}`}>{children}</span>
}
