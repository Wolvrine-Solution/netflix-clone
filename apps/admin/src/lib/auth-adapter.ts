import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { account, db, session, user, verificationToken } from '@netflix/db'

/** Auth.js adapter over our Drizzle tables (Auth.js default column names match ours). */
export const authAdapter = DrizzleAdapter(db, {
  usersTable: user,
  accountsTable: account,
  sessionsTable: session,
  verificationTokensTable: verificationToken,
} as never)
