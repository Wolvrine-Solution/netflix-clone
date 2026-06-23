import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

export function formatRuntime(minutes?: number): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function getReleaseYear(dateString?: string): string {
  if (!dateString) return ''
  return new Date(dateString).getFullYear().toString()
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}

export function formatRating(rating?: number): string {
  if (!rating) return ''
  return `${Math.round(rating * 10)}% Match`
}

export function getPosterUrl(path?: string): string {
  if (!path) return 'https://via.placeholder.com/300x450/141414/808080?text=No+Image'
  return `https://image.tmdb.org/t/p/w500${path}`
}

export function getBackdropUrl(path?: string): string {
  if (!path) return 'https://via.placeholder.com/1280x720/141414/808080?text=No+Image'
  return `https://image.tmdb.org/t/p/w1280${path}`
}
