import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'invite' | 'magiclink' | 'recovery' | null
  const next = searchParams.get('next') ?? '/timer'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_params`)
  }

  // Upsert user row in DB after successful auth
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) {
    const serviceClient = createServiceClient()
    await serviceClient.from('User').upsert({
      id: user.id,
      email: user.email,
      role: (user.user_metadata?.role as string) ?? 'user',
    }, { onConflict: 'id', ignoreDuplicates: true })
  }

  // Invited users must set a password before accessing the app
  if (type === 'invite') {
    return NextResponse.redirect(`${origin}/invite/accept`)
  }

  // Password reset — send to the reset page while session is active
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
