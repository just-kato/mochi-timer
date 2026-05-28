// IMPORTANT: Always uses service role client — never anon client.
// Service role bypasses RLS so we can read/write any user's data.
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { logger } from '@/lib/utils/logger'

const MAX_INVITES_PER_HOUR = 10

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let email: string
  try {
    const body = await request.json() as { email?: unknown }
    if (typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    email = body.email.toLowerCase().trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Rate limiting: max MAX_INVITES_PER_HOUR invites per admin per hour
  const adminUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (adminUser) {
    const now = new Date()
    const windowStart = adminUser.inviteWindowStart
    const withinWindow =
      windowStart && now.getTime() - windowStart.getTime() < 60 * 60 * 1000

    if (withinWindow && adminUser.inviteCount >= MAX_INVITES_PER_HOUR) {
      return NextResponse.json(
        { error: `Rate limit: max ${MAX_INVITES_PER_HOUR} invites per hour` },
        { status: 429 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        inviteCount: withinWindow ? adminUser.inviteCount + 1 : 1,
        inviteWindowStart: withinWindow ? windowStart : now,
      },
    })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) {
    logger.error('Invite failed', { email, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  logger.info('User invited', { email, invitedBy: user.id })
  return NextResponse.json({ success: true })
}
