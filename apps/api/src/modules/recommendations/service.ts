import { prisma } from '@netflix/db'

export async function getRecommendations(profileId: string, limit = 20) {
  const history = await prisma.watchHistory.findMany({
    where: { profileId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: { content: { include: { genres: { include: { genre: true } } } } },
  })

  const genreIds = new Set<number>()
  for (const h of history) {
    for (const g of h.content.genres) genreIds.add(g.genreId)
  }

  if (genreIds.size === 0) {
    return prisma.content.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      take: limit,
      orderBy: { rating: 'desc' },
    })
  }

  const watchedIds = history.map((h) => h.contentId)

  return prisma.content.findMany({
    where: {
      status: 'PUBLISHED',
      id: { notIn: watchedIds },
      genres: { some: { genreId: { in: [...genreIds] } } },
    },
    take: limit,
    orderBy: { rating: 'desc' },
  })
}
