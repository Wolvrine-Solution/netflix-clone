import { prisma } from '@netflix/db'
import { LiveEventStatus } from '@prisma/client'

export async function listLiveChannels() {
  return prisma.liveChannel.findMany({
    where: { isActive: true },
    include: {
      events: {
        where: { status: { in: [LiveEventStatus.SCHEDULED, LiveEventStatus.LIVE] } },
        orderBy: { scheduledStart: 'asc' },
        take: 10,
      },
    },
  })
}

export async function getLiveEvent(eventId: string) {
  return prisma.liveEvent.findUnique({
    where: { id: eventId },
    include: { channel: true },
  })
}

export async function archiveEndedEvent(eventId: string) {
  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } })
  if (!event || event.status !== LiveEventStatus.ENDED) return null

  if (event.archivedContentId) return event.archivedContentId

  const content = await prisma.content.create({
    data: {
      title: `${event.title} (Replay)`,
      description: event.description ?? '',
      mediaType: 'movie',
      posterPath: '',
      backdropPath: '',
      releaseDate: new Date().toISOString().slice(0, 10),
      rating: 0,
      videoUrl: event.playbackUrl,
      status: 'PUBLISHED',
    },
  })

  await prisma.liveEvent.update({
    where: { id: eventId },
    data: { archivedContentId: content.id },
  })

  await prisma.outboxEvent.create({
    data: {
      aggregateType: 'Content',
      aggregateId: content.id,
      eventType: 'content.archived_from_live',
      contentId: content.id,
      payload: { eventId },
    },
  })

  return content.id
}

export function checkGeoRestriction(
  event: { geoRestricted: string[]; blackoutRegions: string[] },
  region?: string
): boolean {
  if (!region) return true
  if (event.blackoutRegions.includes(region)) return false
  if (event.geoRestricted.length > 0 && !event.geoRestricted.includes(region)) return false
  return true
}
