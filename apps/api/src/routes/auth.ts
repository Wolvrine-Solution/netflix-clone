import { Router } from 'express'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'
import { prisma } from '@netflix/db'
import { AppError } from '../middleware/errorHandler'

export const authRouter = Router()

const secret = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'] ?? 'fallback-secret')

authRouter.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string }

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required')
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (!user || !user.hashedPassword) {
      throw new AppError(401, 'Invalid email or password')
    }

    const valid = await compare(password, user.hashedPassword)
    if (!valid) {
      throw new AppError(401, 'Invalid email or password')
    }

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .setJti(crypto.randomUUID())
      .sign(secret)

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
  } catch (err) {
    next(err)
  }
})
