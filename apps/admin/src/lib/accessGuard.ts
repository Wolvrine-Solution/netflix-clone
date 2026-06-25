/**
 * Pure routing-decision logic extracted from middleware.ts so the
 * redirect/allow rules can be unit tested without needing a real
 * NextAuth request/session object.
 */

export type GuardAction =
  | { type: 'next' }
  | { type: 'redirect'; to: '/login' | '/' }

/**
 * Mirrors the decision tree in middleware.ts's default auth() handler:
 * - API routes always pass through untouched
 * - unauthenticated users are redirected to /login (unless already there)
 * - authenticated users on /login are redirected to /
 * - everything else passes through
 */
export function decideAccess(params: {
  isLoggedIn: boolean
  pathname: string
}): GuardAction {
  const { isLoggedIn, pathname } = params
  const isLoginPage = pathname === '/login'
  const isApiRoute = pathname.startsWith('/api')

  if (isApiRoute) return { type: 'next' }
  if (!isLoggedIn && !isLoginPage) return { type: 'redirect', to: '/login' }
  if (isLoggedIn && isLoginPage) return { type: 'redirect', to: '/' }
  return { type: 'next' }
}
