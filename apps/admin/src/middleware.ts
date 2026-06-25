import { auth } from './lib/auth'
import { NextResponse } from 'next/server'
import { decideAccess } from './lib/accessGuard'

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
