const KID_ALLOWED = new Set(['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG'])

export function isMaturityAllowedForKids(rating: string): boolean {
  return KID_ALLOWED.has(rating.toUpperCase())
}

export function maturityWhereForKids() {
  return {
    maturityRating: { in: [...KID_ALLOWED] },
  }
}

export function filterByKidProfile<T extends { maturityRating?: string }>(
  items: T[],
  isKid: boolean
): T[] {
  if (!isKid) return items
  return items.filter((i) => isMaturityAllowedForKids(i.maturityRating ?? 'TV-MA'))
}
