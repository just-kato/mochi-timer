'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { openDB, saveActiveSession, saveSession, clearActiveSession } from '@/lib/indexeddb/client'
import { secondsToDisplay } from '@/lib/utils/time'
import type { LocalSession } from '@/lib/indexeddb/client'

export interface TimerState {
  running: boolean
  paused: boolean
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
    paused: false,
    sessionId: initialSession?.id ?? null,
    startTime: initialSession ? new Date(initialSession.startTime) : null,
    elapsed: '00:00:00',
    loading: false,
    error: null,
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Total milliseconds accumulated while paused
  const totalPausedMsRef = useRef(0)
  // Timestamp when the current pause began (null = not paused)
  const pausedAtRef = useRef<number | null>(null)

  // Tick elapsed time every second while running and not paused
  useEffect(() => {
    if (!state.running || state.paused || !state.startTime) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const rawMs = Date.now() - state.startTime!.getTime()
      const netSecs = Math.floor((rawMs - totalPausedMsRef.current) / 1000)
      setState((s) => ({ ...s, elapsed: secondsToDisplay(Math.max(0, netSecs)) }))
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.running, state.paused, state.startTime])

  const start = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    totalPausedMsRef.current = 0
    pausedAtRef.current = null
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

    setState({ running: true, paused: false, sessionId: id, startTime, elapsed: '00:00:00', loading: false, error: null })
  }, [online])

  const pause = useCallback(() => {
    if (!state.running || state.paused) return
    pausedAtRef.current = Date.now()
    setState((s) => ({ ...s, paused: true }))
  }, [state.running, state.paused])

  const resume = useCallback(() => {
    if (!state.running || !state.paused) return
    if (pausedAtRef.current !== null) {
      totalPausedMsRef.current += Date.now() - pausedAtRef.current
      pausedAtRef.current = null
    }
    setState((s) => ({ ...s, paused: false }))
  }, [state.running, state.paused])

  const stop = useCallback(async (notes?: string, taskId?: string) => {
    if (!state.sessionId || !state.startTime) return
    setState((s) => ({ ...s, loading: true, error: null }))
    const realEndTime = new Date()

    // Accumulate any in-progress pause duration
    let totalPausedMs = totalPausedMsRef.current
    if (pausedAtRef.current !== null) {
      totalPausedMs += realEndTime.getTime() - pausedAtRef.current
    }

    // Shift endTime back by paused duration so the server calculates the correct net duration
    const effectiveEndTime = new Date(realEndTime.getTime() - totalPausedMs)
    const duration = Math.max(0, Math.floor((effectiveEndTime.getTime() - state.startTime.getTime()) / 1000))

    if (online) {
      // 30-second timeout so a hung request can't leave buttons disabled forever
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)
      try {
        const res = await fetch(`/api/sessions/${state.sessionId}/stop`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store', // bypass browser + service-worker cache (prevents stale 304)
          signal: controller.signal,
          body: JSON.stringify({
            endTime: effectiveEndTime.toISOString(),
            startTime: state.startTime.toISOString(),
            ...(taskId ? { taskId } : {}),
          }),
        })
        clearTimeout(timeout)
        if (!res.ok) {
          // 409 means the server already stopped this session (e.g. previous attempt
          // succeeded but the client got a bad/cached response back). Treat as success.
          if (res.status !== 409) {
            const data = await res.json().catch(() => ({})) as { error?: string }
            throw new Error(data.error ?? 'Failed to stop session')
          }
        }
      } catch (err) {
        clearTimeout(timeout)
        const message = err instanceof Error && err.name === 'AbortError'
          ? 'Stop timed out — tap again to retry'
          : err instanceof Error ? err.message : 'Failed to stop session'
        setState((s) => ({ ...s, loading: false, error: message }))
        return
      }
    } else {
      await saveSession({
        id: state.sessionId,
        startTime: state.startTime.toISOString(),
        endTime: effectiveEndTime.toISOString(),
        duration,
        notes: notes?.trim() ?? undefined,
        synced: false,
      })
    }

    await clearActiveSession()
    if (notes !== undefined && notes.trim() && online) {
      await fetch(`/api/sessions/${state.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      }).catch(() => {})
    }

    totalPausedMsRef.current = 0
    pausedAtRef.current = null
    setState({ running: false, paused: false, sessionId: null, startTime: null, elapsed: '00:00:00', loading: false, error: null })
  }, [state.sessionId, state.startTime, online])

  const abandon = useCallback(async () => {
    if (!state.sessionId) return
    setState((s) => ({ ...s, loading: true, error: null }))
    if (online) {
      await fetch(`/api/sessions/${state.sessionId}`, { method: 'DELETE' }).catch(() => {})
    }
    await clearActiveSession()
    totalPausedMsRef.current = 0
    pausedAtRef.current = null
    setState({ running: false, paused: false, sessionId: null, startTime: null, elapsed: '00:00:00', loading: false, error: null })
  }, [state.sessionId, online])

  return { ...state, start, stop, pause, resume, abandon }
}
