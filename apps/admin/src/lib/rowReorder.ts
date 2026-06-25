/**
 * Pure helpers extracted from the row reordering logic in
 * apps/admin/src/app/rows/page.tsx (`moveRow`), so the swap/boundary
 * logic can be unit tested without rendering the page or mocking fetch.
 */

export interface OrderableRow {
  id: string
  order: number
}

export type ReorderDirection = 'up' | 'down'

export interface ReorderResult<T extends OrderableRow> {
  /** New row array with `order` renormalized to a contiguous 1-based sequence, or null if no-op. */
  rows: T[] | null
  /** Payload shape sent to PUT /api/admin/rows/reorder, or null if no-op. */
  payload: Array<{ id: string; order: number }> | null
}

/**
 * Computes the result of moving the row with the given id one position
 * up or down, swapping with its neighbor and renormalizing `order` to
 * 1-based contiguous indices — mirroring moveRow() in rows/page.tsx.
 *
 * Returns { rows: null, payload: null } for no-op cases:
 * - id not found in the list
 * - already at the top and moving up
 * - already at the bottom and moving down
 */
export function computeReorder<T extends OrderableRow>(
  rows: T[],
  id: string,
  direction: ReorderDirection
): ReorderResult<T> {
  const idx = rows.findIndex((r) => r.id === id)
  if (idx === -1) return { rows: null, payload: null }
  if (direction === 'up' && idx === 0) return { rows: null, payload: null }
  if (direction === 'down' && idx === rows.length - 1) return { rows: null, payload: null }

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  const reordered = [...rows]
  const temp = reordered[idx]!
  reordered[idx] = reordered[swapIdx]!
  reordered[swapIdx] = temp

  const renumbered = reordered.map((r, i) => ({ ...r, order: i + 1 }))
  const payload = renumbered.map((r) => ({ id: r.id, order: r.order }))

  return { rows: renumbered, payload }
}
