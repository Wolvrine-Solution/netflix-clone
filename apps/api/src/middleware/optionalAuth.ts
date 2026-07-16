import { Request, Response, NextFunction } from 'express'
import { jwtVerify } from 'jose'
import { getEnv } from '../lib/env'
import { AuthRequest } from './authenticate'

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return next()
    const secret = new TextEncoder().encode(getEnv().NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)
    if (payload.sub) req.userId = payload.sub
    next()
  } catch {
    next()
  }
}
