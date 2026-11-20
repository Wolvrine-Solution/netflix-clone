import { Inject, Injectable } from '@nestjs/common'
import { compare } from 'bcryptjs'
import { eq, user, type Database } from '@netflix/db'
import { AppError } from '../../common/app-error'
import { DB } from '../../common/tokens'
import { TokenService } from './token.service'

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(TokenService) private readonly tokens: TokenService
  ) {}

  async signIn(email: string | undefined, password: string | undefined) {
    if (!email || !password) throw new AppError(400, 'Email and password are required')

    const [u] = await this.db.select().from(user).where(eq(user.email, email.toLowerCase().trim()))
    if (!u || !u.hashedPassword) throw new AppError(401, 'Invalid email or password')
    if (!(await compare(password, u.hashedPassword)))
      throw new AppError(401, 'Invalid email or password')

    const token = await this.tokens.signAccessToken({
      sub: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
    })
    const refreshToken = await this.tokens.issueRefreshToken(u.id)
    return {
      token,
      refreshToken,
      user: { id: u.id, name: u.name, email: u.email, image: u.image },
    }
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new AppError(400, 'refreshToken required')
    const tokens = await this.tokens.rotateRefreshToken(refreshToken)
    if (!tokens) throw new AppError(401, 'Invalid refresh token')
    return { data: tokens }
  }

  async revokeAll(userId: string) {
    await this.tokens.revokeAllRefreshTokens(userId)
    return { data: { revoked: true } }
  }
}
