// IMPORTANT: Always uses service role client — never anon client.
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import { logger } from '@/lib/utils/logger'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (id === user.id) {
    return NextResponse.json({ error: 'Cannot revoke your own access' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient.auth.admin.deleteUser(id)

  if (error) {
    logger.error('Revoke user failed', { id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Remove from our DB as well
  await prisma.user.delete({ where: { id } }).catch(() => {
    // May already be absent — not a hard failure
  })

  logger.info('User revoked', { id, revokedBy: user.id })
  return NextResponse.json({ success: true })
}
