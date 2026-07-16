import { prisma } from '@netflix/db'
import { Plan } from '@prisma/client'
import { getPlanStreamLimit } from '../entitlements/service'
import { getRedis } from '../../lib/redis'

const SESSION_TTL_SEC = 120

export async function registerPlaybackSession(
  userId: string,
  profileId: string | undefined,
  deviceId: string,
  qualityCap?: string
): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  const limit = getPlanStreamLimit(sub?.plan ?? Plan.BASIC)

  const now = new Date()
  await prisma.playbackSession.deleteMany({
    where: { userId, expiresAt: { lt: now } },
  })

  const active = await prisma.playbackSession.count({
    where: { userId, expiresAt: { gt: now } },
  })

  if (active >= limit) {
    const oldest = await prisma.playbackSession.findFirst({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { lastHeartbeat: 'asc' },
    })
    if (oldest) await prisma.playbackSession.delete({ where: { id: oldest.id } })
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000)
  const session = await prisma.playbackSession.create({
    data: { userId, profileId, deviceId, qualityCap, expiresAt },
  })

  const redis = await getRedis()
  await redis.set(`session:${session.id}`, userId, 'EX', SESSION_TTL_SEC)

  return session.id
}

export async function heartbeatSession(sessionId: string, userId: string) {
  const session = await prisma.playbackSession.findFirst({
    where: { id: sessionId, userId },
  })
  if (!session) return false

  const expiresAt = new Date(Date.now() + SESSION_TTL_SEC * 1000)
  await prisma.playbackSession.update({
    where: { id: sessionId },
    data: { lastHeartbeat: new Date(), expiresAt },
  })

  const redis = await getRedis()
  await redis.set(`session:${sessionId}`, userId, 'EX', SESSION_TTL_SEC)
  return true
}
