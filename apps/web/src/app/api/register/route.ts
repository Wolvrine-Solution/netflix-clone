import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db, eq, user as userTable } from '@netflix/db'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = schema.parse(body)
    const [existing] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1)
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
    const hashedPassword = await bcrypt.hash(password, 12)
    const [user] = await db.insert(userTable).values({ email, name, hashedPassword }).returning()
    if (!user) throw new Error('user insert returned no row')
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
