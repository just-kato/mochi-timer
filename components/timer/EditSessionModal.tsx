'use client'

import { useState, useMemo } from 'react'
import type { Session } from '@prisma/client'
import { formatDateTimeLocal } from '@/lib/utils/format'

type EditMode = 'times' | 'duration'
type Anchor = 'end' | 'start'

function parseDurationToSeconds(s: string): number | null {
  const parts = s.trim().split(':')
  if (parts.length < 2 || parts.length > 3) return null
  const nums = parts.map(Number)
  if (nums.some((n) => isNaN(n) || n < 0)) return null
  if (parts.length === 2) {
    const [h, m] = nums
    if (m >= 60) return null
    return h * 3600 + m * 60
  }
  const [h, m, sec] = nums
  if (m >= 60 || sec >= 60) return null
  return h * 3600 + m * 60 + sec
}

function secondsToHHMM(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function formatPreview(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

interface EditSessionModalProps {
  session: Session
  onClose: () => void
  onSaved: (updated: Session) => void
}

export function EditSessionModal({ session, onClose, onSaved }: EditSessionModalProps) {
  const [mode, setMode] = useState<EditMode>('times')
  const [startTime, setStartTime] = useState(formatDateTimeLocal(new Date(session.startTime)))
  const [endTime, setEndTime] = useState(
    session.endTime ? formatDateTimeLocal(new Date(session.endTime)) : ''
  )
  const [notes, setNotes] = useState(session.notes ?? '')
  const [taskId, setTaskId] = useState(session.taskId ?? '')
  const [duration, setDuration] = useState(session.duration ? secondsToHHMM(session.duration) : '')
  const [anchor, setAnchor] = useState<Anchor>('end')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo<Date | null>(() => {
    const secs = parseDurationToSeconds(duration)
    if (!secs || secs <= 0) return null
    if (anchor === 'end') {
      const end = new Date(endTime)
      return isNaN(end.getTime()) ? null : new Date(end.getTime() - secs * 1000)
    }
    const start = new Date(startTime)
    return isNaN(start.getTime()) ? null : new Date(start.getTime() + secs * 1000)
  }, [duration, anchor, startTime, endTime])

  function switchMode(next: EditMode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    let finalStart: Date
    let finalEnd: Date

    if (mode === 'times') {
      finalStart = new Date(startTime)
      finalEnd = new Date(endTime)
      if (!startTime || isNaN(finalStart.getTime())) { setError('Start time is required'); return }
      if (!endTime || isNaN(finalEnd.getTime())) { setError('End time is required'); return }
    } else {
      const secs = parseDurationToSeconds(duration)
      if (!secs || secs <= 0) { setError('Enter a valid duration — e.g. 1:30 or 2:45:00'); return }
      if (anchor === 'end') {
        finalEnd = new Date(endTime)
        if (!endTime || isNaN(finalEnd.getTime())) { setError('End time is required'); return }
        finalStart = new Date(finalEnd.getTime() - secs * 1000)
      } else {
        finalStart = new Date(startTime)
        if (!startTime || isNaN(finalStart.getTime())) { setError('Start time is required'); return }
        finalEnd = new Date(finalStart.getTime() + secs * 1000)
      }
    }

    if (finalEnd <= finalStart) { setError('End time must be after start time'); return }

    if (!taskId.trim()) { setError('Task ID is required'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: finalStart.toISOString(),
          endTime: finalEnd.toISOString(),
          notes: notes.trim() || null,
          taskId: taskId.trim(),
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

  const inputClass = 'w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow focus:text-black dark:bg-zinc-900 dark:text-zinc-100'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Edit session"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border-[3px] border-black bg-white dark:bg-zinc-900 shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-black px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-brutalist-yellow">Edit Session</p>
          <button type="button" onClick={onClose} className="text-brutalist-yellow text-sm font-bold hover:opacity-70" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b-[3px] border-black">
          <button
            type="button"
            onClick={() => switchMode('times')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest border-r-[3px] border-black transition-none ${
              mode === 'times'
                ? 'bg-brutalist-yellow text-black'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Edit Times
          </button>
          <button
            type="button"
            onClick={() => switchMode('duration')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest transition-none ${
              mode === 'duration'
                ? 'bg-brutalist-yellow text-black'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Enter Duration
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {mode === 'times' ? (
            <>
              <div>
                <label htmlFor="edit-start" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
                  Start Time
                </label>
                <input id="edit-start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label htmlFor="edit-end" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
                  End Time
                </label>
                <input id="edit-end" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} required />
              </div>
            </>
          ) : (
            <>
              {/* Duration */}
              <div>
                <label htmlFor="edit-duration" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
                  How long did it actually take?
                </label>
                <input
                  id="edit-duration"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="HH:MM or HH:MM:SS — e.g. 1:30"
                  className={inputClass}
                />
              </div>

              {/* What went wrong */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3 dark:text-zinc-100">
                  What happened?
                </p>
                <div className="space-y-3">
                  {/* Option: started late / missed resume → fix start */}
                  <label
                    className={`flex items-start gap-3 p-3 border-[3px] cursor-pointer ${
                      anchor === 'end'
                        ? 'border-black bg-brutalist-yellow'
                        : 'border-black dark:border-zinc-600 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="anchor"
                      value="end"
                      checked={anchor === 'end'}
                      onChange={() => setAnchor('end')}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black">
                        Started too late / forgot to resume
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5 font-normal normal-case tracking-normal">
                        End time is correct — start time will be recalculated
                      </p>
                      {anchor === 'end' && preview && (
                        <p className="text-xs font-bold mt-1.5 text-black">
                          → New start: {formatPreview(preview)}
                        </p>
                      )}
                    </div>
                  </label>

                  {/* Option: stopped too early → fix end */}
                  <label
                    className={`flex items-start gap-3 p-3 border-[3px] cursor-pointer ${
                      anchor === 'start'
                        ? 'border-black bg-brutalist-yellow'
                        : 'border-black dark:border-zinc-600 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="anchor"
                      value="start"
                      checked={anchor === 'start'}
                      onChange={() => setAnchor('start')}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black">
                        Stopped too early
                      </p>
                      <p className="text-xs text-zinc-600 mt-0.5 font-normal normal-case tracking-normal">
                        Start time is correct — end time will be recalculated
                      </p>
                      {anchor === 'start' && preview && (
                        <p className="text-xs font-bold mt-1.5 text-black">
                          → New end: {formatPreview(preview)}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Task ID — always visible, required */}
          <div>
            <label htmlFor="edit-task-id" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
              Task ID <span className="text-brutalist-red">*</span>
            </label>
            <input
              id="edit-task-id"
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="Paste task UUID"
              className={`${inputClass} font-mono`}
            />
          </div>

          {/* Notes — always visible */}
          <div>
            <label htmlFor="edit-notes" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
              Notes (optional)
            </label>
            <textarea
              id="edit-notes"
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
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-white dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading || !taskId.trim()} className="flex-1 py-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-black text-brutalist-yellow disabled:opacity-50">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
