import { prisma } from '@/lib/prisma/client'
import type { Session } from '@prisma/client'
import { durationSeconds } from '@/lib/utils/time'

export async function getActiveSession(userId: string): Promise<Session | null> {
  return prisma.session.findFirst({
    where: { userId, endTime: null },
    orderBy: { startTime: 'desc' },
  })
}

export async function getSessionsByDateRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Session[]> {
  return prisma.session.findMany({
    where: {
      userId,
      startTime: { gte: start, lte: end },
    },
    orderBy: { startTime: 'asc' },
  })
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
  return prisma.session.create({
    data: { id, userId, startTime, synced },
  })
}

export async function stopSession(
  id: string,
  userId: string,
  endTime: Date
): Promise<Session> {
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Forbidden')
  if (session.endTime !== null) throw new Error('Session already stopped')

  const duration = durationSeconds(session.startTime, endTime)
  return prisma.session.update({
    where: { id },
    data: { endTime, duration, synced: true },
  })
}

export async function updateSessionNotes(
  id: string,
  userId: string,
  notes: string
): Promise<Session> {
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Forbidden')
  // Notes can be updated on stopped sessions — they are annotations, not edits to timing data
  return prisma.session.update({ where: { id }, data: { notes } })
}

export async function getRecentNoteSuggestions(userId: string, limit = 8): Promise<string[]> {
  const rows = await prisma.session.findMany({
    where: { userId, notes: { not: null } },
    orderBy: { startTime: 'desc' },
    select: { notes: true },
    take: 60,
  })

  const seen = new Set<string>()
  const suggestions: string[] = []
  for (const row of rows) {
    const note = row.notes?.trim()
    if (note && !seen.has(note) && suggestions.length < limit) {
      seen.add(note)
      suggestions.push(note)
    }
  }
  return suggestions
}

export async function upsertSession(
  id: string,
  userId: string,
  startTime: Date,
  endTime: Date | null,
  duration: number | null,
  notes: string | null
): Promise<Session> {
  return prisma.session.upsert({
    where: { id },
    update: { endTime, duration, notes, synced: true },
    create: { id, userId, startTime, endTime, duration, notes, synced: true },
  })
}
