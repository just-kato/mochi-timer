'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@prisma/client'
import { SessionItem } from './SessionItem'
import { EditSessionModal } from './EditSessionModal'
import { AddSessionModal } from './AddSessionModal'

interface TodaySessionsProps {
  initialSessions: Session[]
  timezone?: string
  hourlyRate?: number
}

function getTodayInTz(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

function formatDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function shiftDate(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return new Intl.DateTimeFormat('en-CA').format(date)
}

export function TodaySessions({ initialSessions, timezone = 'America/New_York', hourlyRate = 0 }: TodaySessionsProps) {
  const router = useRouter()
  const todayInTz = getTodayInTz(timezone)
  const [selectedDate, setSelectedDate] = useState(todayInTz)
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [prevInitialSessions, setPrevInitialSessions] = useState(initialSessions)
  const [loading, setLoading] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [addingSession, setAddingSession] = useState(false)
  const isToday = selectedDate === todayInTz

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0)
  const totalHours = totalSeconds / 3600
  const hoursDisplay = totalSeconds > 0
    ? totalHours >= 1 ? `${totalHours.toFixed(1)}h` : `${Math.round(totalSeconds / 60)}m`
    : null
  const estimatedEarnings = hourlyRate > 0 && totalSeconds > 0 ? totalHours * hourlyRate : null

  // Sync sessions when server pushes new data (e.g. after router.refresh() following stop/delete).
  // React's recommended pattern: update state during render rather than in an effect.
  if (prevInitialSessions !== initialSessions) {
    setPrevInitialSessions(initialSessions)
    if (selectedDate === todayInTz) {
      setSessions(initialSessions)
    }
  }

  // Auto-clear at midnight in user's timezone
  useEffect(() => {
    const id = setInterval(() => {
      const current = getTodayInTz(timezone)
      if (current !== todayInTz && isToday) {
        setSessions([])
        router.refresh()
      }
    }, 60_000)
    return () => clearInterval(id)
  }, [todayInTz, isToday, router, timezone])

  const loadDay = useCallback(async (date: string) => {
    if (date === todayInTz) {
      setSessions(initialSessions)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions?date=${date}`)
      if (res.ok) {
        const data = await res.json() as { sessions: Session[] }
        setSessions(data.sessions)
      }
    } finally {
      setLoading(false)
    }
  }, [todayInTz, initialSessions])

  function navigate(n: -1 | 1) {
    const next = shiftDate(selectedDate, n)
    if (next > todayInTz) return
    setSelectedDate(next)
    void loadDay(next)
  }

  function handleSaved(updated: Session) {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setEditingSession(null)
  }

  function handleDeleted(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (isToday) router.refresh()
  }

  function handleAdded(session: Session) {
    setSessions((prev) =>
      [...prev, session].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    )
    setAddingSession(false)
  }

  return (
    <>
      <div className="mb-4 pb-3 border-b-[3px] border-black dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Previous day"
            className="btn-brutal w-7 h-7 flex items-center justify-center border-[3px] border-black dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs font-bold dark:text-zinc-100 shrink-0"
          >←</button>
          <h2 className="flex-1 text-center text-xs font-bold uppercase tracking-widest dark:text-zinc-100">
            {formatDayLabel(selectedDate)}
          </h2>
          <button
            type="button"
            onClick={() => navigate(1)}
            disabled={isToday}
            aria-label="Next day"
            className="btn-brutal w-7 h-7 flex items-center justify-center border-[3px] border-black dark:border-zinc-600 bg-white dark:bg-zinc-900 text-xs font-bold dark:text-zinc-100 disabled:opacity-30 shrink-0"
          >→</button>
        </div>
        {(hoursDisplay || estimatedEarnings !== null) && sessions.length > 0 && (
          <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1.5">
            {hoursDisplay && (
              <span className="text-black dark:text-zinc-100">{hoursDisplay}</span>
            )}
            {hoursDisplay && estimatedEarnings !== null && (
              <span className="mx-2">·</span>
            )}
            {estimatedEarnings !== null && (
              <>Est. earned <span className="text-black dark:text-zinc-100">${estimatedEarnings.toFixed(2)}</span></>
            )}
          </p>
        )}
      </div>

      {loading && (
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 py-6 text-center">
          Loading…
        </p>
      )}

      {!loading && sessions.length === 0 && (
        <div className="py-6 text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            {isToday ? 'Start the timer to log your first session.' : 'No sessions'}
          </p>
          {!isToday && (
            <button
              type="button"
              onClick={() => setAddingSession(true)}
              className="btn-brutal text-xs font-bold uppercase tracking-widest border-[3px] border-black px-4 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-100 hover:bg-black hover:text-brutalist-yellow"
            >
              + Add Time
            </button>
          )}
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <>
          <ul className="border-[3px] border-black dark:border-zinc-700 max-h-44 sm:max-h-80 overflow-y-auto">
            {sorted.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onEdit={setEditingSession}
                onDeleted={handleDeleted}
              />
            ))}
          </ul>
          {!isToday && (
            <button
              type="button"
              onClick={() => setAddingSession(true)}
              className="mt-3 btn-brutal text-xs font-bold uppercase tracking-widest border-[3px] border-black px-4 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-100 hover:bg-black hover:text-brutalist-yellow"
            >
              + Add Time
            </button>
          )}
        </>
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={handleSaved}
        />
      )}

      {addingSession && (
        <AddSessionModal
          date={selectedDate}
          onClose={() => setAddingSession(false)}
          onSaved={handleAdded}
        />
      )}
    </>
  )
}
