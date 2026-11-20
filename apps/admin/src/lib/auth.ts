import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db, eq, user as userTable } from '@netflix/db'
import { authAdapter } from './auth-adapter'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: authAdapter,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const [user] = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1)
        if (!user || !user.hashedPassword) return null
        if (user.role !== 'ADMIN') return null
        if (user.isSuspended) return null
        const valid = await compare(password, user.hashedPassword)
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
})
