import { describe, expect, it } from 'vitest'
import { decideAccess } from '../accessGuard'

describe('decideAccess', () => {
  it('always passes through API routes, even for unauthenticated users', () => {
    expect(decideAccess({ isLoggedIn: false, pathname: '/api/auth/session' })).toEqual({
      type: 'next',
    })
  })

  it('always passes through API routes for authenticated users', () => {
    expect(decideAccess({ isLoggedIn: true, pathname: '/api/auth/session' })).toEqual({
      type: 'next',
    })
  })

  it('redirects an unauthenticated user away from a protected page to /login', () => {
    expect(decideAccess({ isLoggedIn: false, pathname: '/content' })).toEqual({
      type: 'redirect',
      to: '/login',
    })
  })

  it('redirects an unauthenticated user away from the root page to /login', () => {
    expect(decideAccess({ isLoggedIn: false, pathname: '/' })).toEqual({
      type: 'redirect',
      to: '/login',
    })
  })

  it('does not redirect an unauthenticated user already on /login', () => {
    expect(decideAccess({ isLoggedIn: false, pathname: '/login' })).toEqual({ type: 'next' })
  })

  it('redirects an authenticated user away from /login to the home page', () => {
    expect(decideAccess({ isLoggedIn: true, pathname: '/login' })).toEqual({
      type: 'redirect',
      to: '/',
    })
  })

  it('allows an authenticated user to access a protected page', () => {
    expect(decideAccess({ isLoggedIn: true, pathname: '/content' })).toEqual({ type: 'next' })
  })

  it('treats API-route check as a prefix match, not an exact match', () => {
    expect(decideAccess({ isLoggedIn: false, pathname: '/api/admin/content/123' })).toEqual({
      type: 'next',
    })
  })

  it('treats any path with the "/api" prefix as an API route, even non-API paths like "/apiary" (locks current prefix-match behavior)', () => {
    expect(decideAccess({ isLoggedIn: false, pathname: '/apiary' })).toEqual({ type: 'next' })
  })
})
