import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from('User').upsert({
    id: user.id,
    email: user.email!,
    role: (user.user_metadata?.role as string) ?? 'user',
    hourlyRate: 0,
    payPeriodStart: 1,
    emailSummary: true,
    timezone: 'America/New_York',
    inviteCount: 0,
    createdAt: now,
    updatedAt: now,
  }, { onConflict: 'id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
