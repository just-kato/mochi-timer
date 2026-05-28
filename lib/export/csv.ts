import { stringify } from 'csv-stringify/sync'
import type { Session } from '@prisma/client'
import { secondsToHours } from '@/lib/utils/time'

export function sessionsToCSV(sessions: Session[]): string {
  const header = ['id', 'start_time', 'end_time', 'duration_seconds', 'duration_hours', 'notes']
  const rows = sessions.map((s) => [
    s.id,
    s.startTime.toISOString(),
    s.endTime ? s.endTime.toISOString() : '',
    s.duration ?? '',
    s.duration ? secondsToHours(s.duration).toFixed(4) : '',
    s.notes ?? '',
  ])
  return stringify([header, ...rows])
}
