import { createHash, randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { SignJWT, jwtVerify } from 'jose'
import { and, eq, isNull, refreshToken, user, type Database } from '@netflix/db'
import { DB, ENV } from '../../common/tokens'
import type { Env } from '../../config/env'

export interface AccessTokenPayload {
  sub: string
  email?: string
  name?: string | null
  role?: string
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

@Injectable()
export class TokenService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(ENV) private readonly env: Env
  ) {}

  private secret() {
    return new TextEncoder().encode(this.env.NEXTAUTH_SECRET)
  }

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(this.env.ACCESS_TOKEN_TTL)
      .setJti(randomUUID())
      .sign(this.secret())
  }

  async verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, this.secret())
    return payload
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const raw = randomUUID() + randomUUID()
    const expiresAt = new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
    await this.db.insert(refreshToken).values({ userId, tokenHash: hashToken(raw), expiresAt })
    return raw
  }

  async rotateRefreshToken(
    raw: string
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokenHash = hashToken(raw)
    const [existing] = await this.db
      .select()
      .from(refreshToken)
      .where(eq(refreshToken.tokenHash, tokenHash))
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) return null

    await this.db
      .update(refreshToken)
      .set({ revokedAt: new Date() })
      .where(eq(refreshToken.id, existing.id))

    const [u] = await this.db.select().from(user).where(eq(user.id, existing.userId))
    if (!u) return null

    const accessToken = await this.signAccessToken({
      sub: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    })
    return { accessToken, refreshToken: await this.issueRefreshToken(u.id) }
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.db
      .update(refreshToken)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshToken.userId, userId), isNull(refreshToken.revokedAt)))
  }
}
