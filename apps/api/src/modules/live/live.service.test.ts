import { describe, expect, it } from 'vitest'
import { checkGeoRestriction } from './live.service'

const ev = (geoRestricted: string[] = [], blackoutRegions: string[] = []) => ({
  geoRestricted,
  blackoutRegions,
})

describe('checkGeoRestriction', () => {
  it('allows everything when no region is supplied', () => {
    expect(checkGeoRestriction(ev(['US'], ['CA']))).toBe(true)
  })
  it('blocks blackout regions even when also allow-listed', () => {
    expect(checkGeoRestriction(ev(['US'], ['US']), 'US')).toBe(false)
  })
  it('requires the region to be in a non-empty allow-list', () => {
    expect(checkGeoRestriction(ev(['US', 'CA']), 'US')).toBe(true)
    expect(checkGeoRestriction(ev(['US', 'CA']), 'FR')).toBe(false)
  })
  it('allows any region when both lists are empty', () => {
    expect(checkGeoRestriction(ev(), 'BR')).toBe(true)
  })
})
