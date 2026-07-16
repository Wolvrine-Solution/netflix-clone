import { createHash, randomUUID } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@netflix/db'
import { getEnv } from './env'

function getSecret() {
  return new TextEncoder().encode(getEnv().NEXTAUTH_SECRET)
}

export interface AccessTokenPayload {
  sub: string
  email?: string
  name?: string | null
  role?: string
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const ttl = getEnv().ACCESS_TOKEN_TTL
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .setJti(randomUUID())
    .sign(getSecret())
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret())
  return payload
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = randomUUID() + randomUUID()
  const tokenHash = hashToken(raw)
  const days = getEnv().REFRESH_TOKEN_TTL_DAYS
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  await prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } })
  return raw
}

export async function rotateRefreshToken(raw: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  const tokenHash = hashToken(raw)
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } })
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) return null

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  })

  const user = await prisma.user.findUnique({ where: { id: existing.userId } })
  if (!user) return null

  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
  const refreshToken = await issueRefreshToken(user.id)
  return { accessToken, refreshToken }
}

export async function revokeAllRefreshTokens(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
