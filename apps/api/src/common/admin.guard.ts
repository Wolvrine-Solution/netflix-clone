import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { eq, user, type Database } from '@netflix/db'
import { AdminMfaSessionService } from '../modules/auth/admin-mfa-session.service'
import { TokenService } from '../modules/auth/token.service'
import { AppError } from './app-error'
import type { AppRequest } from './request-context'
import { DB } from './tokens'

async function loadAdmin(db: Database, userId: string) {
  const [u] = await db
    .select({ role: user.role, isSuspended: user.isSuspended, mfaEnabled: user.mfaEnabled })
    .from(user)
    .where(eq(user.id, userId))
  if (!u || u.role !== 'ADMIN') throw new AppError(403, 'Forbidden — admin access required')
  if (u.isSuspended) throw new AppError(403, 'Account suspended')
  return u
}

async function authenticate(tokens: TokenService, req: AppRequest): Promise<string> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new AppError(401, 'Unauthorized')
    const payload = await tokens.verifyAccessToken(token)
    if (!payload.sub) throw new AppError(401, 'Unauthorized')
    req.userId = payload.sub
    return payload.sub
  } catch {
    throw new AppError(401, 'Unauthorized')
  }
}

/** Admin role + not suspended; does NOT require an MFA session (used by the MFA endpoints). */
@Injectable()
export class AdminBaseGuard implements CanActivate {
  constructor(
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(DB) private readonly db: Database
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AppRequest>()
    const userId = await authenticate(this.tokens, req)
    await loadAdmin(this.db, userId)
    return true
  }
}

/** Admin role + not suspended + valid MFA session when the admin enabled MFA. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(TokenService) private readonly tokens: TokenService,
    @Inject(DB) private readonly db: Database,
    @Inject(AdminMfaSessionService) private readonly mfa: AdminMfaSessionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AppRequest>()
    const userId = await authenticate(this.tokens, req)
    const u = await loadAdmin(this.db, userId)
    if (u.mfaEnabled && !this.mfa.has(userId)) throw new AppError(403, 'MFA verification required')
    return true
  }
}
