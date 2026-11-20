import { and, eq, profile, type Database } from '@netflix/db'
import { AppError } from './app-error'

export async function assertProfileOwned(db: Database, profileId: string, userId: string) {
  const [p] = await db
    .select()
    .from(profile)
    .where(and(eq(profile.id, profileId), eq(profile.userId, userId)))
    .limit(1)
  if (!p) throw new AppError(403, 'Forbidden')
  return p
}
