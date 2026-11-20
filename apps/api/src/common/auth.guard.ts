import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { TokenService } from '../modules/auth/token.service'
import { AppError } from './app-error'
import type { AppRequest } from './request-context'

function bearer(req: AppRequest): string | undefined {
  return req.headers.authorization?.replace('Bearer ', '')
}

/** Requires a valid access token; sets req.userId. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TokenService) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AppRequest>()
    try {
      const token = bearer(req)
      if (!token) throw new AppError(401, 'Unauthorized')
      const payload = await this.tokens.verifyAccessToken(token)
      if (!payload.sub) throw new AppError(401, 'Unauthorized')
      req.userId = payload.sub
      return true
    } catch {
      throw new AppError(401, 'Unauthorized')
    }
  }
}

/** Sets req.userId when a valid token is present; never rejects. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(TokenService) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AppRequest>()
    try {
      const token = bearer(req)
      if (token) {
        const payload = await this.tokens.verifyAccessToken(token)
        if (payload.sub) req.userId = payload.sub
      }
    } catch {
      // invalid token on an optional route behaves as anonymous
    }
    return true
  }
}
