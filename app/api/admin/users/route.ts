import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAllUsers } from '@/lib/db/users'
import type { PendingInvite } from '@/lib/types/admin'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = createServiceClient()
  const [allUsers, { data: authData }] = await Promise.all([
    getAllUsers(),
    serviceClient.auth.admin.listUsers(),
  ])

  const pendingInvites: PendingInvite[] = (authData?.users ?? [])
    .filter((u) => u.invited_at && !u.email_confirmed_at)
    .map((u) => ({
      id: u.id,
      email: u.email ?? '',
      invitedAt: u.invited_at!,
    }))

  return NextResponse.json({ users: allUsers, pendingInvites })
}
