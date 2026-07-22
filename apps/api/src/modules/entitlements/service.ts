import { Plan, SubStatus } from '@prisma/client'
import { prisma } from '@netflix/db'

export type EntitlementAction = 'play' | 'download' | 'live'

const PLAN_LIMITS: Record<Plan, { maxStreams: number; maxQuality: string; downloads: boolean }> = {
  BASIC: { maxStreams: 1, maxQuality: '720p', downloads: false },
  STANDARD: { maxStreams: 2, maxQuality: '1080p', downloads: false },
  PREMIUM: { maxStreams: 4, maxQuality: '4k', downloads: true },
}

export async function can(
  userId: string,
  action: EntitlementAction,
  resource: { contentId?: string; eventId?: string }
): Promise<{ allowed: boolean; reason?: string; qualityCap?: string }> {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub || (sub.status !== SubStatus.ACTIVE && sub.status !== SubStatus.TRIALING)) {
    return { allowed: false, reason: 'No active subscription' }
  }

  const limits = PLAN_LIMITS[sub.plan]

  if (action === 'download' && !limits.downloads) {
    return { allowed: false, reason: 'Downloads not included in plan' }
  }

  if (resource.contentId) {
    const content = await prisma.content.findUnique({
      where: { id: resource.contentId },
      include: { licenseWindows: true },
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
      const purchase = await prisma.purchase.findFirst({
        where: { userId, contentId: resource.contentId },
      })
      if (purchase) return { allowed: true, qualityCap: limits.maxQuality }
    }
  }

  if (resource.eventId && action === 'live') {
    const entitled = await prisma.eventEntitlement.findUnique({
      where: { eventId_userId: { eventId: resource.eventId, userId } },
    })
    const purchase = await prisma.purchase.findFirst({
      where: { userId, eventId: resource.eventId },
    })
    if (!entitled && !purchase && sub.plan === Plan.BASIC) {
      return { allowed: false, reason: 'Event not entitled' }
    }
  }

  return { allowed: true, qualityCap: limits.maxQuality }
}

export function getPlanStreamLimit(plan: Plan): number {
  return PLAN_LIMITS[plan].maxStreams
}
