import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateSession, deleteSession } from '@/lib/db/sessions'
import { logger } from '@/lib/utils/logger'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let startTime: Date | undefined
  let endTime: Date | undefined
  let notes: string | null | undefined
  let taskId: string | null | undefined

  try {
    const body = await request.json() as { startTime?: unknown; endTime?: unknown; notes?: unknown; taskId?: unknown }

    if (body.startTime !== undefined) {
      if (typeof body.startTime !== 'string') return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 })
      startTime = new Date(body.startTime)
      if (isNaN(startTime.getTime())) return NextResponse.json({ error: 'Invalid startTime' }, { status: 400 })
    }
    if (body.endTime !== undefined) {
      if (typeof body.endTime !== 'string') return NextResponse.json({ error: 'Invalid endTime' }, { status: 400 })
      endTime = new Date(body.endTime)
      if (isNaN(endTime.getTime())) return NextResponse.json({ error: 'Invalid endTime' }, { status: 400 })
    }
    if (body.notes !== undefined) {
      if (body.notes !== null && typeof body.notes !== 'string') return NextResponse.json({ error: 'Invalid notes' }, { status: 400 })
      notes = body.notes as string | null
    }
    if (body.taskId !== undefined) {
      if (body.taskId !== null && typeof body.taskId !== 'string') return NextResponse.json({ error: 'Invalid taskId' }, { status: 400 })
      taskId = (body.taskId as string | null)?.trim() || null
    }

    if (startTime === undefined && endTime === undefined && notes === undefined && taskId === undefined) {
      return NextResponse.json({ error: 'At least one field required' }, { status: 400 })
    }
    if (startTime !== undefined && endTime !== undefined && endTime <= startTime) {
      return NextResponse.json({ error: 'endTime must be after startTime' }, { status: 422 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const session = await updateSession(id, user.id, { startTime, endTime, notes, taskId })
    logger.info('Session updated', { id, userId: user.id })
    return NextResponse.json({ session })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'Session not found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (message === 'Cannot edit active session') return NextResponse.json({ error: message }, { status: 409 })
    if (message === 'endTime must be after startTime') return NextResponse.json({ error: message }, { status: 422 })
    logger.error('Session update failed', { id, error: message })
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteSession(id, user.id)
    logger.info('Session deleted', { id, userId: user.id })
    return NextResponse.json({})
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'Session not found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (message === 'Cannot delete active session') return NextResponse.json({ error: message }, { status: 409 })
    logger.error('Session delete failed', { id, error: message })
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
