import type { NextAuthConfig } from 'next-auth'
import { SignJWT } from 'jose'

/**
 * Edge-safe Auth.js config: no database, adapter or Node-only imports. Shared by the middleware
 * (edge runtime) and the full config in auth.ts. Providers are added in auth.ts.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token['userId'] = user.id
        token['role'] = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token['userId'] as string
        ;(session.user as { role?: string }).role = token['role'] as string
      }
      const secret = process.env['NEXTAUTH_SECRET']
      if (secret && secret.length >= 32) {
        ;(session as { accessToken?: string }).accessToken = await new SignJWT({
          role: token['role'] as string,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject(token['userId'] as string)
          .setIssuedAt()
          .setExpirationTime('15m')
          .sign(new TextEncoder().encode(secret))
      }
      return session
    },
  },
} satisfies NextAuthConfig
