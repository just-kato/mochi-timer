import type { Session } from '@prisma/client'
import { createServiceClient } from '@/lib/supabase/server'
import { durationSeconds } from '@/lib/utils/time'

interface SupabaseSessionRow {
  id: string
  userId: string
  startTime: string
  endTime: string | null
  duration: number | null
  notes: string | null
  synced: boolean
  createdAt: string
}

// Supabase returns TIMESTAMP(3) columns as naive ISO strings without timezone info.
// Append 'Z' so Node.js parses them as UTC rather than local time.
function toUTCDate(s: string): Date {
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z')
}

function mapSession(row: SupabaseSessionRow): Session {
  return {
    id: row.id,
    userId: row.userId,
    startTime: toUTCDate(row.startTime),
    endTime: row.endTime ? toUTCDate(row.endTime) : null,
    duration: row.duration,
    notes: row.notes,
    synced: row.synced,
    createdAt: toUTCDate(row.createdAt),
  }
}

export async function getActiveSession(userId: string): Promise<Session | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('Session')
    .select()
    .eq('userId', userId)
    .is('endTime', null)
    .order('startTime', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? mapSession(data as SupabaseSessionRow) : null
}

export async function getSessionsByDateRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Session[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('Session')
    .select()
    .eq('userId', userId)
    .gte('startTime', start.toISOString())
    .lte('startTime', end.toISOString())
    .order('startTime', { ascending: true })
  return (data ?? []).map((row) => mapSession(row as SupabaseSessionRow))
}

export async function getSessionsByDay(userId: string, date: Date): Promise<Session[]> {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return getSessionsByDateRange(userId, start, end)
}

export async function createSession(
  id: string,
  userId: string,
  startTime: Date,
  synced: boolean
): Promise<Session> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('Session')
    .insert({ id, userId, startTime: startTime.toISOString(), synced })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapSession(data as SupabaseSessionRow)
}

export async function stopSession(
  id: string,
  userId: string,
  endTime: Date
): Promise<Session> {
  const supabase = createServiceClient()
  const { data: session, error: fetchError } = await supabase
    .from('Session')
    .select()
    .eq('id', id)
    .maybeSingle()
  if (fetchError) throw new Error(fetchError.message)
  if (!session) throw new Error('Session not found')
  const row = session as SupabaseSessionRow
  if (row.userId !== userId) throw new Error('Forbidden')
  if (row.endTime !== null) throw new Error('Session already stopped')

  const duration = durationSeconds(toUTCDate(row.startTime), endTime)
  const { data: updated, error: updateError } = await supabase
    .from('Session')
    .update({ endTime: endTime.toISOString(), duration, synced: true })
    .eq('id', id)
    .select()
    .single()
  if (updateError) throw new Error(updateError.message)
  return mapSession(updated as SupabaseSessionRow)
}

export async function updateSessionNotes(
  id: string,
  userId: string,
  notes: string
): Promise<Session> {
  const supabase = createServiceClient()
  const { data: session, error: fetchError } = await supabase
    .from('Session')
    .select()
    .eq('id', id)
    .maybeSingle()
  if (fetchError) throw new Error(fetchError.message)
  if (!session) throw new Error('Session not found')
  const row = session as SupabaseSessionRow
  if (row.userId !== userId) throw new Error('Forbidden')

  const { data: updated, error: updateError } = await supabase
    .from('Session')
    .update({ notes })
    .eq('id', id)
    .select()
    .single()
  if (updateError) throw new Error(updateError.message)
  return mapSession(updated as SupabaseSessionRow)
}

export async function getRecentNoteSuggestions(userId: string, limit = 8): Promise<string[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('Session')
    .select('notes')
    .eq('userId', userId)
    .not('notes', 'is', null)
    .order('startTime', { ascending: false })
    .limit(60)

  const seen = new Set<string>()
  const suggestions: string[] = []
  for (const row of data ?? []) {
    const note = (row as { notes: string | null }).notes?.trim()
    if (note && !seen.has(note) && suggestions.length < limit) {
      seen.add(note)
      suggestions.push(note)
    }
  }
  return suggestions
}

export async function updateSession(
  id: string,
  userId: string,
  fields: { startTime?: Date; endTime?: Date; notes?: string | null }
): Promise<Session> {
  const supabase = createServiceClient()
  const { data: session, error: fetchError } = await supabase
    .from('Session')
    .select()
    .eq('id', id)
    .maybeSingle()
  if (fetchError) throw new Error(fetchError.message)
  if (!session) throw new Error('Session not found')
  const row = session as SupabaseSessionRow
  if (row.userId !== userId) throw new Error('Forbidden')
  if (row.endTime === null) throw new Error('Cannot edit active session')

  const newStart = fields.startTime ?? toUTCDate(row.startTime)
  const newEnd = fields.endTime !== undefined ? fields.endTime : (row.endTime ? toUTCDate(row.endTime) : null)
  if (newEnd !== null && newEnd <= newStart) throw new Error('endTime must be after startTime')

  const duration = newEnd ? durationSeconds(newStart, newEnd) : null

  const updateData: Record<string, unknown> = {}
  if (fields.startTime !== undefined) updateData.startTime = fields.startTime.toISOString()
  if (fields.endTime !== undefined) updateData.endTime = fields.endTime?.toISOString() ?? null
  if (fields.notes !== undefined) updateData.notes = fields.notes
  if (fields.startTime !== undefined || fields.endTime !== undefined) updateData.duration = duration

  const { data: updated, error: updateError } = await supabase
    .from('Session')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  if (updateError) throw new Error(updateError.message)
  return mapSession(updated as SupabaseSessionRow)
}

export async function deleteSession(id: string, userId: string): Promise<void> {
  const supabase = createServiceClient()
  const { data: session, error: fetchError } = await supabase
    .from('Session')
    .select()
    .eq('id', id)
    .maybeSingle()
  if (fetchError) throw new Error(fetchError.message)
  if (!session) throw new Error('Session not found')
  const row = session as SupabaseSessionRow
  if (row.userId !== userId) throw new Error('Forbidden')
  if (row.endTime === null) throw new Error('Cannot delete active session')

  const { error: deleteError } = await supabase
    .from('Session')
    .delete()
    .eq('id', id)
  if (deleteError) throw new Error(deleteError.message)
}

export async function getSessionHistory(
  userId: string,
  page: number,
  pageSize: number
): Promise<{ sessions: Session[]; total: number }> {
  const supabase = createServiceClient()
  const from = (page - 1) * pageSize
  const to = page * pageSize - 1
  const { data, count } = await supabase
    .from('Session')
    .select('*', { count: 'exact' })
    .eq('userId', userId)
    .order('startTime', { ascending: false })
    .range(from, to)
  return {
    sessions: (data ?? []).map((row) => mapSession(row as SupabaseSessionRow)),
    total: count ?? 0,
  }
}

export async function upsertSession(
  id: string,
  userId: string,
  startTime: Date,
  endTime: Date | null,
  duration: number | null,
  notes: string | null
): Promise<Session> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('Session')
    .upsert({
      id,
      userId,
      startTime: startTime.toISOString(),
      endTime: endTime?.toISOString() ?? null,
      duration,
      notes,
      synced: true,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapSession(data as SupabaseSessionRow)
}
