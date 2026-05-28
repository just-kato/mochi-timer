import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { upsertSession } from '@/lib/db/sessions'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let id: string, startTime: Date, endTime: Date | null, duration: number | null, notes: string | null
  try {
    const body = await request.json() as {
      id?: unknown
      startTime?: unknown
      endTime?: unknown
      duration?: unknown
      notes?: unknown
    }
    if (typeof body.id !== 'string' || !body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    if (typeof body.startTime !== 'string') {
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 })
    }
    id = body.id
    startTime = new Date(body.startTime)
    endTime = typeof body.endTime === 'string' ? new Date(body.endTime) : null
    duration = typeof body.duration === 'number' ? body.duration : null
    notes = typeof body.notes === 'string' ? body.notes : null

    if (isNaN(startTime.getTime())) {
      return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 })
    }
    if (endTime && isNaN(endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid endTime' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const session = await upsertSession(id, user.id, startTime, endTime, duration, notes)
    logger.info('Session synced from offline', { id, userId: user.id })
    return NextResponse.json({ session })
  } catch (err) {
    logger.error('Session sync failed', { error: String(err) })
    return NextResponse.json({ error: 'Failed to sync session' }, { status: 500 })
  }
}
