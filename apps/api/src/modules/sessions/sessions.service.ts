import { Inject, Injectable } from '@nestjs/common'
import { and, asc, eq, gt, lt, playbackSession, subscription, type Database } from '@netflix/db'
import { DB, REDIS } from '../../common/tokens'
import type { getRedis } from '../../lib/redis'
import { getPlanStreamLimit } from '../entitlements/entitlements.service'

type Redis = Awaited<ReturnType<typeof getRedis>>

export const SESSION_TTL_SEC = 120

/** Concurrent-stream registry: DB rows are the source of truth, Redis mirrors liveness. */
@Injectable()
export class SessionsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(REDIS) private readonly redis: Redis
  ) {}

  async register(
    userId: string,
    profileId: string | undefined,
    deviceId: string,
    qualityCap?: string
  ): Promise<string> {
    const sub = await this.db.query.subscription.findFirst({
      where: eq(subscription.userId, userId),
    })
    const limit = getPlanStreamLimit(sub?.plan ?? 'BASIC')

    const id = await this.db.transaction(async (tx) => {
      const now = new Date()
      await tx
        .delete(playbackSession)
        .where(and(eq(playbackSession.userId, userId), lt(playbackSession.expiresAt, now)))

      const live = and(eq(playbackSession.userId, userId), gt(playbackSession.expiresAt, now))
      const active = await tx.$count(playbackSession, live)
      if (active >= limit) {
        const [oldest] = await tx
          .select({ id: playbackSession.id })
          .from(playbackSession)
          .where(live)
          .orderBy(asc(playbackSession.lastHeartbeat))
          .limit(1)
        if (oldest) await tx.delete(playbackSession).where(eq(playbackSession.id, oldest.id))
      }

      const [created] = await tx
        .insert(playbackSession)
        .values({
          userId,
          profileId,
          deviceId,
          qualityCap,
          expiresAt: new Date(Date.now() + SESSION_TTL_SEC * 1000),
        })
        .returning({ id: playbackSession.id })
      return created!.id
    })

    await this.redis.set(`session:${id}`, userId, 'EX', SESSION_TTL_SEC)
    return id
  }

  async heartbeat(sessionId: string, userId: string): Promise<boolean> {
    const [session] = await this.db
      .select({ id: playbackSession.id })
      .from(playbackSession)
      .where(and(eq(playbackSession.id, sessionId), eq(playbackSession.userId, userId)))
      .limit(1)
    if (!session) return false

    await this.db
      .update(playbackSession)
      .set({
        lastHeartbeat: new Date(),
        expiresAt: new Date(Date.now() + SESSION_TTL_SEC * 1000),
      })
      .where(eq(playbackSession.id, sessionId))
    await this.redis.set(`session:${sessionId}`, userId, 'EX', SESSION_TTL_SEC)
    return true
  }
}
