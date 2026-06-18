import NextAuth from 'next-auth'
import { encode } from 'next-auth/jwt'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@netflix/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.hashedPassword) return null
        if (user.role !== 'ADMIN') return null
        if (user.isSuspended) return null
        const valid = await compare(password, user.hashedPassword)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role }
      },
    }),
  ],
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
      ;(session as { accessToken?: string }).accessToken = await encode({
        token,
        secret: process.env['NEXTAUTH_SECRET'] ?? '',
        salt: 'authjs.session-token',
      })
      return session
    },
  },
})
