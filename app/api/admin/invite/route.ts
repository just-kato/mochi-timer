// IMPORTANT: Always uses service role client — never anon client.
// Service role bypasses RLS so we can read/write any user's data.
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { getAppUrl } from '@/lib/utils/appUrl'

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
  const serviceClient = createServiceClient()
  const { data: adminUser } = await serviceClient
    .from('User')
    .select('inviteCount, inviteWindowStart')
    .eq('id', user.id)
    .maybeSingle()

  if (adminUser) {
    const now = new Date()
    const rawWindow = (adminUser as { inviteWindowStart: string | null }).inviteWindowStart
    const windowStart = rawWindow
      ? new Date(rawWindow.endsWith('Z') || rawWindow.includes('+') ? rawWindow : rawWindow + 'Z')
      : null
    const withinWindow = windowStart && now.getTime() - windowStart.getTime() < 60 * 60 * 1000
    const inviteCount = (adminUser as { inviteCount: number }).inviteCount

    if (withinWindow && inviteCount >= MAX_INVITES_PER_HOUR) {
      return NextResponse.json(
        { error: `Rate limit: max ${MAX_INVITES_PER_HOUR} invites per hour` },
        { status: 429 }
      )
    }

    await serviceClient.from('User').update({
      inviteCount: withinWindow ? inviteCount + 1 : 1,
      inviteWindowStart: withinWindow ? rawWindow : now.toISOString(),
    }).eq('id', user.id)
  }

  const { error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getAppUrl(request)}/auth/callback?type=invite`,
  })

  if (error) {
    logger.error('Invite failed', { email, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  logger.info('User invited', { email, invitedBy: user.id })
  return NextResponse.json({ success: true })
}
