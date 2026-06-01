import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (id === user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const body = await request.json() as { role?: unknown }
  if (body.role !== 'admin' && body.role !== 'user') {
    return NextResponse.json({ error: 'Role must be "admin" or "user"' }, { status: 422 })
  }
  const role = body.role

  const serviceClient = createServiceClient()

  // Update both the User table and Supabase auth metadata so they stay in sync
  const [{ error: dbError }, { error: authError }] = await Promise.all([
    serviceClient.from('User').update({ role, updatedAt: new Date().toISOString() }).eq('id', id),
    serviceClient.auth.admin.updateUserById(id, { user_metadata: { role } }),
  ])

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  return NextResponse.json({ success: true, role })
}
