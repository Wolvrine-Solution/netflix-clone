import { Router } from 'express'
import { compare } from 'bcryptjs'
import { prisma } from '@netflix/db'
import { AppError } from '../middleware/errorHandler'
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeAllRefreshTokens,
} from '../lib/jwt'

export const authRouter = Router()

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

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
    const refreshToken = await issueRefreshToken(user.id)

    res.json({
      token: accessToken,
      refreshToken,
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

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) throw new AppError(400, 'refreshToken required')
    const tokens = await rotateRefreshToken(refreshToken)
    if (!tokens) throw new AppError(401, 'Invalid refresh token')
    res.json({ data: tokens })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/revoke', async (req, res, next) => {
  try {
    const { userId } = req.body as { userId?: string }
    if (!userId) throw new AppError(400, 'userId required')
    await revokeAllRefreshTokens(userId)
    res.json({ data: { revoked: true } })
  } catch (err) {
    next(err)
  }
})
