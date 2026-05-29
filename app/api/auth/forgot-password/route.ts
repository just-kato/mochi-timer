import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/utils/appUrl'

export async function POST(request: Request): Promise<NextResponse> {
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

  // Check user exists before sending — don't leak which emails are registered
  const serviceClient = createServiceClient()
  const { data: user } = await serviceClient
    .from('User')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (user) {
    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl(request)}/login`,
    })
  }

  // Always return 200 regardless — don't reveal whether the email exists
  return NextResponse.json({ ok: true })
}
