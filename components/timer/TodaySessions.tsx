'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@prisma/client'
import { SessionItem } from './SessionItem'
import { EditSessionModal } from './EditSessionModal'
import { AddSessionModal } from './AddSessionModal'

interface TodaySessionsProps {
  initialSessions: Session[]
}

function getTodayEST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
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

export function TodaySessions({ initialSessions }: TodaySessionsProps) {
  const router = useRouter()
  const todayEST = getTodayEST()
  const [selectedDate, setSelectedDate] = useState(todayEST)
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [loading, setLoading] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [addingSession, setAddingSession] = useState(false)
  const isToday = selectedDate === todayEST

  // Auto-clear at midnight EST
  useEffect(() => {
    const id = setInterval(() => {
      const current = getTodayEST()
      if (current !== todayEST && isToday) {
        setSessions([])
        router.refresh()
      }
    }, 60_000)
    return () => clearInterval(id)
  }, [todayEST, isToday, router])

  const loadDay = useCallback(async (date: string) => {
    if (date === todayEST) {
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
  }, [todayEST, initialSessions])

  function navigate(n: -1 | 1) {
    const next = shiftDate(selectedDate, n)
    if (next > todayEST) return
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
      <div className="flex items-center gap-3 mb-4 pb-3 border-b-[3px] border-black dark:border-zinc-700">
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
            {sessions.map((session) => (
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
