'use client'

import { useState } from 'react'
import type { Session } from '@prisma/client'
import { formatTime, formatDate } from '@/lib/utils/format'
import { secondsToDisplay } from '@/lib/utils/time'

interface SessionItemProps {
  session: Session
  onEdit?: (session: Session) => void
  onDeleted?: (id: string) => void
  showDate?: boolean
}

export function SessionItem({ session, onEdit, onDeleted, showDate = true }: SessionItemProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const start = new Date(session.startTime)
  const end = session.endTime ? new Date(session.endTime) : null
  const duration = session.duration ? secondsToDisplay(session.duration) : '—'
  const canEdit = !!onEdit && end !== null
  const canDelete = !!onDeleted && end !== null

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted?.(session.id)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <li className="py-3 px-4 border-b-[3px] border-black last:border-b-0 dark:border-zinc-700">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold font-mono-brutal dark:text-zinc-100">
            {formatTime(start)} — {end ? formatTime(end) : 'RUNNING'}
          </p>
          {showDate && (
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-0.5">
              {formatDate(start)}
            </p>
          )}
          {session.notes && (
            <p className="text-xs mt-1 text-zinc-700 dark:text-zinc-400 truncate">{session.notes}</p>
          )}
        </div>

        <span className="text-sm font-mono-brutal font-bold tabular-nums shrink-0 dark:text-zinc-100">{duration}</span>

        {canEdit && !confirming && (
          <button
            type="button"
            onClick={() => onEdit(session)}
            aria-label="Edit session"
            className="btn-brutal w-8 h-8 flex items-center justify-center shrink-0 border-[3px] border-black bg-white text-black hover:bg-black hover:text-brutalist-yellow dark:bg-zinc-900 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-100 dark:hover:text-black"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        {canDelete && !confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Delete session"
            className="btn-brutal w-8 h-8 flex items-center justify-center shrink-0 border-[3px] border-brutalist-red text-brutalist-red hover:bg-brutalist-red hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
        {confirming && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-brutalist-red">Delete?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="btn-brutal h-8 px-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-black text-brutalist-yellow disabled:opacity-50"
            >
              {deleting ? '…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs font-bold uppercase tracking-widest text-zinc-500 underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
