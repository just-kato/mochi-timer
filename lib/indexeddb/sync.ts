import {
  getUnsyncedSessions,
  markSessionSynced,
  getActiveSession,
  saveActiveSession,
} from './client'
import { logger } from '@/lib/utils/logger'

export async function syncPendingSessions(): Promise<void> {
  const [pending, active] = await Promise.all([
    getUnsyncedSessions(),
    getActiveSession(),
  ])

  const hasWork = pending.length > 0 || (active && !active.synced)
  if (!hasWork) return

  for (const session of pending) {
    try {
      if (!session.endTime) {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: session.id, startTime: session.startTime }),
        })
      } else {
        await fetch('/api/sessions/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            notes: session.notes ?? null,
          }),
        })
      }
      await markSessionSynced(session.id)
      logger.info('Session synced', { id: session.id })
    } catch (err) {
      logger.warn('Session sync failed', { id: session.id, error: String(err) })
    }
  }

  if (active && !active.synced) {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: active.id, startTime: active.startTime }),
      })
      await saveActiveSession({ ...active, synced: true })
      logger.info('Active session synced', { id: active.id })
    } catch (err) {
      logger.warn('Active session sync failed', { id: active.id, error: String(err) })
    }
  }
}
