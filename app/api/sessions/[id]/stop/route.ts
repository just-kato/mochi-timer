import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stopSession } from '@/lib/db/sessions'
import { logger } from '@/lib/utils/logger'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let endTime: Date
  let startTime: Date | undefined
  try {
    const body = await request.json() as { endTime?: unknown; startTime?: unknown }
    if (typeof body.endTime !== 'string') {
      return NextResponse.json({ error: 'endTime is required' }, { status: 400 })
    }
    endTime = new Date(body.endTime)
    if (isNaN(endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid endTime' }, { status: 400 })
    }
    if (typeof body.startTime === 'string') {
      const parsed = new Date(body.startTime)
      if (!isNaN(parsed.getTime())) startTime = parsed
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const session = await stopSession(id, user.id, endTime, startTime)
    logger.info('Session stopped', { id, userId: user.id })
    return NextResponse.json({ session })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'Session already stopped') {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    logger.error('Session stop failed', { id, error: message })
    return NextResponse.json({ error: 'Failed to stop session' }, { status: 500 })
  }
}
