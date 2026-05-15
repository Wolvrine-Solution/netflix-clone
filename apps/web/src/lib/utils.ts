import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatRating(rating: number): string {
  return `${Math.round(rating * 10)}% Match`
}

export function getReleaseYear(releaseDate: string): string {
  return releaseDate ? new Date(releaseDate).getFullYear().toString() : ''
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + '...'
}
