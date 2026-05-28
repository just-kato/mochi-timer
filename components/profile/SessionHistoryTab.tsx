'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@prisma/client'
import { SessionItem } from '@/components/timer/SessionItem'
import { EditSessionModal } from '@/components/timer/EditSessionModal'

interface HistoryResponse {
  sessions: Session[]
  total: number
  page: number
  pageSize: number
}

export function SessionHistoryTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/history?page=${p}`)
      if (!res.ok) throw new Error('Failed to load sessions')
      const data = await res.json() as HistoryResponse
      setSessions(data.sessions)
      setTotal(data.total)
      setPage(data.page)
      setPageSize(data.pageSize)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchPage(1) }, [fetchPage])

  function handleSaved(updated: Session) {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setEditingSession(null)
  }

  function handleDeleted(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setTotal((t) => t - 1)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="bg-black px-4 py-2 border-b-[3px] border-black">
        <p className="text-xs font-bold uppercase tracking-widest text-white">All Sessions</p>
      </div>

      {loading && (
        <div className="px-6 py-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading…</p>
        </div>
      )}

      {error && !loading && (
        <div className="px-6 py-5 border-b-[3px] border-black bg-red-100">
          <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="px-6 py-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">No sessions yet</p>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <>
          <ul className="max-h-125 overflow-y-auto">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onEdit={setEditingSession}
                onDeleted={handleDeleted}
              />
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t-[3px] border-black dark:border-zinc-700">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => void fetchPage(page - 1)}
                className="text-xs font-bold uppercase tracking-widest border-[3px] border-black px-4 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => void fetchPage(page + 1)}
                className="text-xs font-bold uppercase tracking-widest border-[3px] border-black px-4 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
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
    </div>
  )
}
