import React from 'react'

interface AvatarProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = { sm: 'h-8 w-8', md: 'h-12 w-12', lg: 'h-20 w-20', xl: 'h-32 w-32' }

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded object-cover ${sizeMap[size]} ${className}`}
    />
  )
}
