import { prisma } from '@netflix/db'
import { DsarStatus } from '@prisma/client'

export async function recordConsent(
  userId: string,
  consentType: string,
  granted: boolean,
  ipAddress?: string
) {
  return prisma.consentRecord.create({
    data: { userId, consentType, granted, ipAddress },
  })
}

export async function createDsarRequest(userId: string, type: 'EXPORT' | 'DELETE') {
  return prisma.dataSubjectRequest.create({
    data: { userId, type, status: 'PENDING' },
  })
}

export async function processDsarExport(requestId: string) {
  const req = await prisma.dataSubjectRequest.findUnique({ where: { id: requestId } })
  if (!req || req.type !== 'EXPORT') return null

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      profiles: { include: { watchHistory: { include: { content: true } } } },
      subscription: true,
    },
  })

  await prisma.dataSubjectRequest.update({
    where: { id: requestId },
    data: { status: DsarStatus.COMPLETED, completedAt: new Date() },
  })

  return {
    user: { id: user?.id, email: user?.email, name: user?.name },
    profiles: user?.profiles,
    watchHistory: user?.profiles.flatMap((p) =>
      p.watchHistory.map((h) => ({
        contentId: h.contentId,
        progress: h.progress,
        title: h.content.title,
      }))
    ),
    subscription: user?.subscription,
    exportedAt: new Date().toISOString(),
  }
}

export async function processDsarDelete(requestId: string) {
  const req = await prisma.dataSubjectRequest.findUnique({ where: { id: requestId } })
  if (!req || req.type !== 'DELETE') return false

  await prisma.$transaction([
    prisma.watchHistory.deleteMany({ where: { profile: { userId: req.userId } } }),
    prisma.myListItem.deleteMany({ where: { profile: { userId: req.userId } } }),
    prisma.profile.deleteMany({ where: { userId: req.userId } }),
    prisma.consentRecord.deleteMany({ where: { userId: req.userId } }),
    prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: { status: DsarStatus.COMPLETED, completedAt: new Date() },
    }),
  ])

  return true
}

export async function createDmcaTakedown(
  reporterEmail: string,
  details: string,
  contentId?: string
) {
  return prisma.dmcaTakedown.create({
    data: { reporterEmail, details, contentId },
  })
}

export async function unpublishExpiredLicenses() {
  const now = new Date()
  const expired = await prisma.licenseWindow.findMany({
    where: { endsAt: { lt: now } },
    include: { content: true },
  })

  const contentIds = [...new Set(expired.map((w) => w.contentId))]
  if (contentIds.length === 0) return 0

  await prisma.content.updateMany({
    where: { id: { in: contentIds }, status: 'PUBLISHED' },
    data: { status: 'ARCHIVED' },
  })

  return contentIds.length
}
