import NextAuth from 'next-auth'
import { authConfig } from './lib/auth.config'
import { NextResponse } from 'next/server'
import { decideAccess } from './lib/accessGuard'

// Edge runtime: use the DB-free config, never lib/auth.ts.
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const action = decideAccess({ isLoggedIn: !!req.auth, pathname: req.nextUrl.pathname })
  if (action.type === 'redirect') {
    return NextResponse.redirect(new URL(action.to, req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
