import {
  getUnsyncedSessions,
  markSessionSynced,
  getActiveSession,
  saveActiveSession,
} from './client'
import { logger } from '@/lib/utils/logger'

export async function syncPendingSessions(): Promise<void> {
  const pending = await getUnsyncedSessions()
  if (pending.length === 0) return

  for (const session of pending) {
    try {
      if (!session.endTime) {
        // Active session — ensure it exists on server (upsert via POST, idempotent)
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: session.id, startTime: session.startTime }),
        })
      } else {
        // Stopped session — upsert via sync endpoint
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

  // Re-sync active session's synced flag in IndexedDB
  const active = await getActiveSession()
  if (active && !active.synced) {
    await saveActiveSession({ ...active, synced: true })
  }
}
