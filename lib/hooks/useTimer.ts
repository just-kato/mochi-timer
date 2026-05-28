'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { openDB, saveActiveSession, clearActiveSession } from '@/lib/indexeddb/client'
import { secondsToDisplay } from '@/lib/utils/time'
import type { LocalSession } from '@/lib/indexeddb/client'

export interface TimerState {
  running: boolean
  sessionId: string | null
  startTime: Date | null
  elapsed: string
  loading: boolean
  error: string | null
}

export function useTimer(initialSession: LocalSession | null = null) {
  const online = useOnlineStatus()
  const [state, setState] = useState<TimerState>({
    running: initialSession !== null,
    sessionId: initialSession?.id ?? null,
    startTime: initialSession ? new Date(initialSession.startTime) : null,
    elapsed: '00:00:00',
    loading: false,
    error: null,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tick elapsed time every second while running
  useEffect(() => {
    if (!state.running || !state.startTime) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - state.startTime!.getTime()) / 1000)
      setState((s) => ({ ...s, elapsed: secondsToDisplay(secs) }))
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.running, state.startTime])

  const start = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const id = crypto.randomUUID()
    const startTime = new Date()

    await openDB()
    await saveActiveSession({ id, startTime: startTime.toISOString(), synced: false })

    if (online) {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, startTime: startTime.toISOString() }),
        })
        if (!res.ok) throw new Error('Failed to create session')
        await saveActiveSession({ id, startTime: startTime.toISOString(), synced: true })
      } catch {
        // Keep going — session is in IndexedDB, will sync later
      }
    }

    setState({ running: true, sessionId: id, startTime, elapsed: '00:00:00', loading: false, error: null })
  }, [online])

  const stop = useCallback(async (notes?: string) => {
    if (!state.sessionId || !state.startTime) return
    setState((s) => ({ ...s, loading: true, error: null }))
    const endTime = new Date()

    if (online) {
      try {
        const res = await fetch(`/api/sessions/${state.sessionId}/stop`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endTime: endTime.toISOString() }),
        })
        if (!res.ok) throw new Error('Failed to stop session')
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to stop session',
        }))
        return
      }
    }

    await clearActiveSession()
    if (notes !== undefined && notes.trim()) {
      // Notes saved via separate PATCH — only if we have notes to save
      if (online) {
        await fetch(`/api/sessions/${state.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        }).catch(() => {})
      }
    }

    setState({ running: false, sessionId: null, startTime: null, elapsed: '00:00:00', loading: false, error: null })
  }, [state.sessionId, state.startTime, online])

  return { ...state, start, stop }
}
