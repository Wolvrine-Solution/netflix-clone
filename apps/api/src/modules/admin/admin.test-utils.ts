import type { TestApp } from '../../../test/harness'

/** Seed an admin and return a bearer token for it. */
export async function adminAuth(t: TestApp, o: Parameters<TestApp['seedUser']>[0] = {}) {
  const admin = await t.seedUser({ role: 'ADMIN', ...o })
  return { admin, token: await t.token(admin.id) }
}
