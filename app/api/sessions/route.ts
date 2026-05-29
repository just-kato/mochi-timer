import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSession, getSessionsByDateRange } from '@/lib/db/sessions'
import { dayBoundsInTimezone } from '@/lib/utils/time'
import { getUserById } from '@/lib/db/users'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')

  let start: Date
  let end: Date

  if (dateParam) {
    const dbUser = await getUserById(user.id)
    const timezone = dbUser?.timezone ?? 'America/New_York'
    const bounds = dayBoundsInTimezone(dateParam, timezone)
    start = bounds.start
    end = bounds.end
  } else if (startParam && endParam) {
    start = new Date(startParam)
    end = new Date(endParam)
  } else {
    return NextResponse.json({ error: 'Provide date or start+end params' }, { status: 400 })
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const sessions = await getSessionsByDateRange(user.id, start, end)
  return NextResponse.json({ sessions })
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let id: string
  let startTime: Date
  try {
    const body = await request.json() as { id?: unknown; startTime?: unknown }
    if (typeof body.id !== 'string' || !body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    if (typeof body.startTime !== 'string') {
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 })
    }
    id = body.id
    startTime = new Date(body.startTime)
    if (isNaN(startTime.getTime())) {
      return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    // Sessions created online are immediately synced
    const session = await createSession(id, user.id, startTime, true)
    logger.info('Session created', { id, userId: user.id })
    return NextResponse.json({ session }, { status: 201 })
  } catch (err) {
    logger.error('Session create failed', { error: String(err) })
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
