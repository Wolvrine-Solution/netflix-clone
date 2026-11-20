import { subscription, type Database, type Plan, type SubStatus } from '@netflix/db'

export async function seedSubscription(
  db: Database,
  userId: string,
  plan: Plan = 'STANDARD',
  status: SubStatus = 'ACTIVE'
) {
  const [s] = await db.insert(subscription).values({ userId, plan, status }).returning()
  return s!
}
