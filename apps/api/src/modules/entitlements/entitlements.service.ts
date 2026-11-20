import { Inject, Injectable } from '@nestjs/common'
import {
  and,
  eq,
  type Database,
  type Plan,
  purchase,
  eventEntitlement,
  subscription,
} from '@netflix/db'
import { DB } from '../../common/tokens'

export type EntitlementAction = 'play' | 'download' | 'live'

export interface EntitlementResult {
  allowed: boolean
  reason?: string
  qualityCap?: string
}

export const PLAN_LIMITS: Record<
  Plan,
  { maxStreams: number; maxQuality: string; downloads: boolean }
> = {
  BASIC: { maxStreams: 1, maxQuality: '720p', downloads: false },
  STANDARD: { maxStreams: 2, maxQuality: '1080p', downloads: false },
  PREMIUM: { maxStreams: 4, maxQuality: '4k', downloads: true },
}

export function getPlanStreamLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].maxStreams
}

@Injectable()
export class EntitlementsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async can(
    userId: string,
    action: EntitlementAction,
    resource: { contentId?: string; eventId?: string }
  ): Promise<EntitlementResult> {
    const sub = await this.db.query.subscription.findFirst({
      where: eq(subscription.userId, userId),
    })
    if (!sub || (sub.status !== 'ACTIVE' && sub.status !== 'TRIALING')) {
      return { allowed: false, reason: 'No active subscription' }
    }

    const limits = PLAN_LIMITS[sub.plan]

    if (action === 'download' && !limits.downloads) {
      return { allowed: false, reason: 'Downloads not included in plan' }
    }

    if (resource.contentId) {
      const content = await this.db.query.content.findFirst({
        where: (c, { eq: e }) => e(c.id, resource.contentId!),
        with: { licenseWindows: true },
      })
      if (!content || content.status !== 'PUBLISHED') {
        return { allowed: false, reason: 'Content unavailable' }
      }
      const now = new Date()
      if (content.licenseWindows.length > 0) {
        const inWindow = content.licenseWindows.some((w) => w.startsAt <= now && w.endsAt >= now)
        if (!inWindow) return { allowed: false, reason: 'Outside license window' }
      }

      if (action === 'play') {
        const bought = await this.db.query.purchase.findFirst({
          where: and(eq(purchase.userId, userId), eq(purchase.contentId, resource.contentId)),
        })
        if (bought) return { allowed: true, qualityCap: limits.maxQuality }
      }
    }

    if (resource.eventId && action === 'live') {
      const entitled = await this.db.query.eventEntitlement.findFirst({
        where: and(
          eq(eventEntitlement.eventId, resource.eventId),
          eq(eventEntitlement.userId, userId)
        ),
      })
      const bought = await this.db.query.purchase.findFirst({
        where: and(eq(purchase.userId, userId), eq(purchase.eventId, resource.eventId)),
      })
      if (!entitled && !bought && sub.plan === 'BASIC') {
        return { allowed: false, reason: 'Event not entitled' }
      }
    }

    return { allowed: true, qualityCap: limits.maxQuality }
  }
}
