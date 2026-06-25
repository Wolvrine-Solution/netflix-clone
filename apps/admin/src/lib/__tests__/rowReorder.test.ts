import { describe, expect, it } from 'vitest'
import { computeReorder, type OrderableRow } from '../rowReorder'

function makeRows(): OrderableRow[] {
  return [
    { id: 'a', order: 1 },
    { id: 'b', order: 2 },
    { id: 'c', order: 3 },
    { id: 'd', order: 4 },
  ]
}

describe('computeReorder', () => {
  it('swaps a middle row up with its predecessor', () => {
    const { rows, payload } = computeReorder(makeRows(), 'c', 'up')
    expect(rows?.map((r) => r.id)).toEqual(['a', 'c', 'b', 'd'])
    expect(payload).toEqual([
      { id: 'a', order: 1 },
      { id: 'c', order: 2 },
      { id: 'b', order: 3 },
      { id: 'd', order: 4 },
    ])
  })

  it('swaps a middle row down with its successor', () => {
    const { rows, payload } = computeReorder(makeRows(), 'b', 'down')
    expect(rows?.map((r) => r.id)).toEqual(['a', 'c', 'b', 'd'])
    expect(payload).toEqual([
      { id: 'a', order: 1 },
      { id: 'c', order: 2 },
      { id: 'b', order: 3 },
      { id: 'd', order: 4 },
    ])
  })

  it('is a no-op when moving the first row up', () => {
    const { rows, payload } = computeReorder(makeRows(), 'a', 'up')
    expect(rows).toBeNull()
    expect(payload).toBeNull()
  })

  it('is a no-op when moving the last row down', () => {
    const { rows, payload } = computeReorder(makeRows(), 'd', 'down')
    expect(rows).toBeNull()
    expect(payload).toBeNull()
  })

  it('is a no-op when the id does not exist in the list', () => {
    const { rows, payload } = computeReorder(makeRows(), 'does-not-exist', 'up')
    expect(rows).toBeNull()
    expect(payload).toBeNull()
  })

  it('is a no-op on an empty list regardless of direction', () => {
    expect(computeReorder([], 'a', 'up')).toEqual({ rows: null, payload: null })
    expect(computeReorder([], 'a', 'down')).toEqual({ rows: null, payload: null })
  })

  it('is a no-op for a single-row list in both directions', () => {
    const single: OrderableRow[] = [{ id: 'only', order: 1 }]
    expect(computeReorder(single, 'only', 'up').rows).toBeNull()
    expect(computeReorder(single, 'only', 'down').rows).toBeNull()
  })

  it('moving the second of two rows up swaps to the front', () => {
    const two: OrderableRow[] = [
      { id: 'first', order: 1 },
      { id: 'second', order: 2 },
    ]
    const { rows } = computeReorder(two, 'second', 'up')
    expect(rows?.map((r) => r.id)).toEqual(['second', 'first'])
    expect(rows?.map((r) => r.order)).toEqual([1, 2])
  })

  it('renumbers order contiguously starting at 1 even if input order values were sparse/out of sync', () => {
    const sparse: OrderableRow[] = [
      { id: 'a', order: 10 },
      { id: 'b', order: 50 },
      { id: 'c', order: 999 },
    ]
    const { rows } = computeReorder(sparse, 'b', 'up')
    expect(rows?.map((r) => r.order)).toEqual([1, 2, 3])
  })

  it('preserves extra fields on each row object after a swap', () => {
    const rowsWithExtra = [
      { id: 'a', order: 1, title: 'Trending', isActive: true },
      { id: 'b', order: 2, title: 'Popular', isActive: false },
    ]
    const { rows } = computeReorder(rowsWithExtra, 'b', 'up')
    expect(rows?.[0]).toMatchObject({ id: 'b', title: 'Popular', isActive: false, order: 1 })
    expect(rows?.[1]).toMatchObject({ id: 'a', title: 'Trending', isActive: true, order: 2 })
  })

  it('does not mutate the original input array', () => {
    const original = makeRows()
    const snapshot = original.map((r) => ({ ...r }))
    computeReorder(original, 'b', 'down')
    expect(original).toEqual(snapshot)
  })
})
