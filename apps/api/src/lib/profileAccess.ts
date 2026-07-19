import { prisma } from '@netflix/db'
import { AppError } from '../middleware/errorHandler'

export async function assertProfileOwned(profileId: string, userId: string) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId },
  })
  if (!profile) throw new AppError(403, 'Forbidden')
  return profile
}
