import { Inject, Injectable } from '@nestjs/common'
import {
  asc,
  content,
  eq,
  inArray,
  liveChannel,
  liveEvent,
  outboxEvent,
  type Database,
} from '@netflix/db'
import { AppError } from '../../common/app-error'
import { DB } from '../../common/tokens'

export interface CreateLiveEventInput {
  channelId: string
  title: string
  description?: string
  scheduledStart: string
  scheduledEnd?: string
  ingestUrl?: string
  playbackUrl?: string
}

/** Pure geo/blackout rule: blackout always wins; an allow-list, when set, must contain the region. */
export function checkGeoRestriction(
  event: { geoRestricted: string[]; blackoutRegions: string[] },
  region?: string
): boolean {
  if (!region) return true
  if (event.blackoutRegions.includes(region)) return false
  if (event.geoRestricted.length > 0 && !event.geoRestricted.includes(region)) return false
  return true
}

@Injectable()
export class LiveService {
  constructor(@Inject(DB) private readonly db: Database) {}

  listChannels() {
    return this.db.query.liveChannel.findMany({
      where: eq(liveChannel.isActive, true),
      with: {
        events: {
          where: inArray(liveEvent.status, ['SCHEDULED', 'LIVE']),
          orderBy: asc(liveEvent.scheduledStart),
          limit: 10,
        },
      },
    })
  }

  getEvent(eventId: string) {
    return this.db.query.liveEvent.findFirst({
      where: eq(liveEvent.id, eventId),
      with: { channel: true },
    })
  }

  async createEvent(input: CreateLiveEventInput) {
    const [channel] = await this.db
      .select({ id: liveChannel.id })
      .from(liveChannel)
      .where(eq(liveChannel.id, input.channelId))
    if (!channel) throw new AppError(404, 'Channel not found')
    const [event] = await this.db
      .insert(liveEvent)
      .values({
        ...input,
        scheduledStart: new Date(input.scheduledStart),
        scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
      })
      .returning()
    return event!
  }

  /** Mark ended, then replicate to VOD (idempotent: returns the existing content id on re-run). */
  async endAndArchive(eventId: string): Promise<string | null> {
    const updated = await this.db
      .update(liveEvent)
      .set({ status: 'ENDED' })
      .where(eq(liveEvent.id, eventId))
      .returning({ id: liveEvent.id })
    if (updated.length === 0) throw new AppError(404, 'Event not found')
    return this.archiveEndedEvent(eventId)
  }

  async archiveEndedEvent(eventId: string): Promise<string | null> {
    const [event] = await this.db.select().from(liveEvent).where(eq(liveEvent.id, eventId))
    if (!event || event.status !== 'ENDED') return null
    if (event.archivedContentId) return event.archivedContentId

    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(content)
        .values({
          title: `${event.title} (Replay)`,
          description: event.description ?? '',
          mediaType: 'movie',
          posterPath: '',
          backdropPath: '',
          releaseDate: new Date().toISOString().slice(0, 10),
          rating: 0,
          videoUrl: event.playbackUrl,
          status: 'PUBLISHED',
        })
        .returning({ id: content.id })
      const contentId = created!.id
      await tx
        .update(liveEvent)
        .set({ archivedContentId: contentId })
        .where(eq(liveEvent.id, eventId))
      await tx.insert(outboxEvent).values({
        aggregateType: 'Content',
        aggregateId: contentId,
        eventType: 'content.archived_from_live',
        contentId,
        payload: { eventId },
      })
      return contentId
    })
  }
}
