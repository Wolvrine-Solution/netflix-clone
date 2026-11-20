import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common'
import { and, eq, profile, type Database } from '@netflix/db'
import type { AppRequest } from './request-context'
import { DB } from './tokens'

/**
 * Resolves whether the active profile is a kid profile (query profileId / x-profile-id header,
 * or ?isKid=true). Never rejects. Run after JwtAuthGuard/OptionalAuthGuard so userId is set.
 */
@Injectable()
export class KidProfileGuard implements CanActivate {
  constructor(@Inject(DB) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AppRequest>()
    try {
      const query = req.query as Record<string, string | undefined>
      const header = req.headers['x-profile-id']
      const profileId = query['profileId'] ?? (Array.isArray(header) ? header[0] : header)
      if (profileId && req.userId) {
        const [p] = await this.db
          .select()
          .from(profile)
          .where(and(eq(profile.id, profileId), eq(profile.userId, req.userId)))
          .limit(1)
        if (p) req.isKidProfile = p.isKid
      } else if (query['isKid'] === 'true') {
        req.isKidProfile = true
      }
    } catch {
      // resolution failure behaves as non-kid, matching the previous middleware
    }
    return true
  }
}
