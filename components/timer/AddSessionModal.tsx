'use client'

import { useState } from 'react'
import type { Session } from '@prisma/client'
import { formatDateTimeLocal } from '@/lib/utils/format'

interface AddSessionModalProps {
  date: string // YYYY-MM-DD
  onClose: () => void
  onSaved: (session: Session) => void
}

export function AddSessionModal({ date, onClose, onSaved }: AddSessionModalProps) {
  const [y, m, d] = date.split('-').map(Number)
  const [startTime, setStartTime] = useState(formatDateTimeLocal(new Date(y, m - 1, d, 9, 0)))
  const [endTime, setEndTime] = useState(formatDateTimeLocal(new Date(y, m - 1, d, 10, 0)))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime())) { setError('Start time is required'); return }
    if (isNaN(end.getTime())) { setError('End time is required'); return }
    if (end <= start) { setError('End time must be after start time'); return }

    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    const id = crypto.randomUUID()

    setLoading(true)
    try {
      const res = await fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          duration,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to save')
      }
      const data = await res.json() as { session: Session }
      onSaved(data.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add session"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border-[3px] border-black bg-white dark:bg-zinc-900 shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-brutalist-yellow">Add Session</p>
          <button type="button" onClick={onClose} className="text-brutalist-yellow text-sm font-bold hover:opacity-70" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div>
            <label htmlFor="add-start" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">Start Time</label>
            <input
              id="add-start"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow focus:text-black dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label htmlFor="add-end" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">End Time</label>
            <input
              id="add-end"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow focus:text-black dark:bg-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label htmlFor="add-notes" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">Notes (optional)</label>
            <textarea
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm resize-none focus:outline-none focus:bg-brutalist-yellow focus:text-black dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {error && (
            <div className="border-[3px] border-black bg-red-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-white dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-black text-brutalist-yellow disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
