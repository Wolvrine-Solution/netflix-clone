import { inArray, type SQL, type AnyColumn } from '@netflix/db'

const KID_ALLOWED = ['G', 'PG', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG']
const KID_SET = new Set(KID_ALLOWED)

export function isMaturityAllowedForKids(rating: string): boolean {
  return KID_SET.has(rating.toUpperCase())
}

/** SQL condition restricting a maturityRating column to kid-safe ratings. */
export function kidsMaturityCondition(column: AnyColumn): SQL {
  return inArray(column, KID_ALLOWED)
}

export function filterByKidProfile<T extends { maturityRating?: string }>(
  items: T[],
  isKid: boolean
): T[] {
  if (!isKid) return items
  return items.filter((i) => isMaturityAllowedForKids(i.maturityRating ?? 'TV-MA'))
}
