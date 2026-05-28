'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TimerButton } from './TimerButton'
import { useTimer } from '@/lib/hooks/useTimer'
import type { LocalSession } from '@/lib/indexeddb/client'

interface ActiveTimerProps {
  initialSession: LocalSession | null
  recentNotes?: string[]
}

export function ActiveTimer({ initialSession, recentNotes = [] }: ActiveTimerProps) {
  const [notes, setNotes] = useState('')
  const router = useRouter()
  const { running, elapsed, loading, error, start, stop } = useTimer(initialSession)

  async function handleStop() {
    await stop(notes)
    setNotes('')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className={`w-full border-[3px] border-black dark:border-zinc-700 flex items-center justify-center py-10 px-6 shadow-brutal ${
          running ? 'bg-brutalist-yellow' : 'bg-white dark:bg-zinc-900'
        }`}
        aria-live="polite"
        aria-label={`Elapsed time: ${elapsed}`}
      >
        <span className={`text-7xl font-mono-brutal font-bold tabular-nums tracking-tight ${
          running ? 'text-black' : 'dark:text-zinc-100'
        }`}>
          {elapsed}
        </span>
      </div>

      <TimerButton
        running={running}
        loading={loading}
        onStart={start}
        onStop={handleStop}
      />

      {running && (
        <div className="w-full space-y-3">
          <div>
            <label htmlFor="notes" className="block text-xs font-bold uppercase tracking-widest mb-2">
              NOTES (OPTIONAL)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What are you working on?"
              className="w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm resize-none focus:outline-none focus:bg-brutalist-yellow focus:text-black"
            />
          </div>

          {recentNotes.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Recent
              </p>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {recentNotes.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setNotes(note)}
                    className={`px-3 py-1.5 text-xs font-bold border-2 border-black dark:border-zinc-600 tracking-wide transition-none ${
                      notes === note
                        ? 'bg-black text-brutalist-yellow'
                        : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-brutalist-yellow hover:text-black'
                    }`}
                  >
                    {note.length > 32 ? `${note.slice(0, 32)}…` : note}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="w-full border-[3px] border-black dark:border-zinc-700 bg-brutalist-red px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
        </div>
      )}
    </div>
  )
}
