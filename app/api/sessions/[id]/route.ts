import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSessionNotes } from '@/lib/db/sessions'
import { logger } from '@/lib/utils/logger'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let notes: string
  try {
    const body = await request.json() as { notes?: unknown }
    if (typeof body.notes !== 'string' || !body.notes.trim()) {
      return NextResponse.json({ error: 'notes must be a non-empty string' }, { status: 400 })
    }
    notes = body.notes.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const session = await updateSessionNotes(id, user.id, notes)
    logger.info('Session notes updated', { id, userId: user.id })
    return NextResponse.json({ session })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (message === 'Session not found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    logger.error('Session notes update failed', { id, error: message })
    return NextResponse.json({ error: 'Failed to update session notes' }, { status: 500 })
  }
}
