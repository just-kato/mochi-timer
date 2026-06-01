'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TimerButton } from './TimerButton'
import { useTimer } from '@/lib/hooks/useTimer'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { toast } from '@/components/shared/Toast'
import type { LocalSession } from '@/lib/indexeddb/client'

const LS_TASK_ID   = 'mochi-last-task-id'
const LS_LAST_NOTE = 'mochi-last-note'
const LS_REPEAT    = 'mochi-repeat-note'

interface ActiveTimerProps {
  initialSession: LocalSession | null
  recentNotes?: string[]
}

export function ActiveTimer({ initialSession, recentNotes = [] }: ActiveTimerProps) {
  const [taskId, setTaskId]         = useState('')
  const [notes, setNotes]           = useState('')
  const [repeatNote, setRepeatNote] = useState(false)
  const [savedNote, setSavedNote]   = useState('')

  // Load persisted values after mount (avoids SSR mismatch)
  useEffect(() => {
    const storedTaskId = localStorage.getItem(LS_TASK_ID) ?? ''
    const storedNote   = localStorage.getItem(LS_LAST_NOTE) ?? ''
    const repeatOn     = localStorage.getItem(LS_REPEAT) === 'true'
    setTaskId(storedTaskId)
    setSavedNote(storedNote)
    setRepeatNote(repeatOn)
    if (repeatOn) setNotes(storedNote)
  }, [])

  const router = useRouter()
  const online = useOnlineStatus()
  const { running, paused, elapsed, loading, error, start, stop, pause, resume } = useTimer(initialSession)

  function handleTaskIdChange(value: string) {
    setTaskId(value)
    // Persist immediately so switching tabs to look up the UUID doesn't lose it
    localStorage.setItem(LS_TASK_ID, value)
  }

  function toggleRepeat() {
    if (!repeatNote) {
      // Turning ON — need something to repeat
      const noteToRepeat = notes.trim() || savedNote
      if (!noteToRepeat) {
        toast({ message: 'Type a note first before enabling repeat', type: 'error' })
        return
      }
      // If the user has typed a fresh note, promote it to the saved note
      if (notes.trim()) {
        localStorage.setItem(LS_LAST_NOTE, notes.trim())
        setSavedNote(notes.trim())
      }
      setNotes(noteToRepeat)
    } else {
      // Turning OFF — clear the locked note
      setNotes('')
    }
    const next = !repeatNote
    setRepeatNote(next)
    localStorage.setItem(LS_REPEAT, String(next))
  }

  async function handleStop() {
    const finalNotes  = notes.trim()
    const finalTaskId = taskId.trim()

    if (finalTaskId) localStorage.setItem(LS_TASK_ID, finalTaskId)
    if (finalNotes) {
      localStorage.setItem(LS_LAST_NOTE, finalNotes)
      setSavedNote(finalNotes)
    }

    await stop(finalNotes, finalTaskId)

    // Repeat mode: restore note for the next session; otherwise clear
    setNotes(repeatNote ? (localStorage.getItem(LS_LAST_NOTE) ?? '') : '')
    if (online) router.refresh()
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className={`w-full border-[3px] flex flex-col items-center justify-center py-10 px-6 shadow-brutal transition-colors ${
          running && !paused
            ? 'border-black dark:border-black bg-brutalist-yellow'
            : 'border-black dark:border-zinc-700 bg-white dark:bg-zinc-900'
        }`}
        role="status"
        aria-live="polite"
        aria-label={`Elapsed time: ${elapsed}`}
      >
        <span className={`text-7xl font-mono-brutal font-bold tabular-nums tracking-tight ${
          running && !paused ? 'text-black' : 'dark:text-zinc-100'
        }`}>
          {elapsed}
        </span>
        {paused && (
          <span className="mt-3 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-2 border-zinc-300 dark:border-zinc-600 px-3 py-1">
            PAUSED
          </span>
        )}
      </div>

      <TimerButton
        running={running}
        paused={paused}
        loading={loading}
        canStop={true}
        onStart={start}
        onStop={handleStop}
        onPause={pause}
        onResume={resume}
      />

      {running && (
        <div className="w-full space-y-3">
          {/* Task ID — always required, persisted across sessions */}
          <div>
            <label htmlFor="task-id" className="block text-xs font-bold uppercase tracking-widest mb-2 dark:text-zinc-100">
              TASK ID
            </label>
            <div className="flex gap-1.5">
              <input
                id="task-id"
                type="text"
                value={taskId}
                onChange={(e) => handleTaskIdChange(e.target.value)}
                placeholder="Task UUID"
                className="flex-1 min-w-0 border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm font-mono focus:outline-none focus:bg-brutalist-yellow focus:text-black dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText()
                    handleTaskIdChange(text.trim())
                  } catch { /* clipboard permission denied */ }
                }}
                className="btn-brutal shrink-0 border-[3px] border-black dark:border-zinc-600 bg-white dark:bg-zinc-900 dark:text-zinc-100 px-3 py-2 text-xs font-bold uppercase tracking-widest"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Notes + repeat toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor={repeatNote ? undefined : 'notes'}
                className="text-xs font-bold uppercase tracking-widest dark:text-zinc-100"
              >
                NOTES {repeatNote ? '' : '(OPTIONAL)'}
              </label>
              <button
                type="button"
                onClick={toggleRepeat}
                disabled={!repeatNote && !notes.trim() && !savedNote}
                className={`text-xs font-bold uppercase tracking-widest border-[3px] px-2 py-0.5 btn-brutal disabled:opacity-30 disabled:cursor-not-allowed ${
                  repeatNote
                    ? 'border-black bg-black text-brutalist-yellow'
                    : 'border-black dark:border-zinc-600 bg-white dark:bg-zinc-900 dark:text-zinc-100'
                }`}
                title={
                  !repeatNote && !notes.trim() && !savedNote
                    ? 'Type a note first to enable repeat'
                    : repeatNote
                    ? 'Repeating last note — click to disable'
                    : 'Keep the same note each session'
                }
              >
                {repeatNote ? 'REPEAT: ON' : 'REPEAT: OFF'}
              </button>
            </div>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={repeatNote}
              rows={3}
              placeholder={repeatNote ? '' : 'What are you working on?'}
              className={`w-full border-[3px] border-black dark:border-zinc-700 px-3 py-2 text-sm resize-none focus:outline-none dark:bg-zinc-900 dark:text-zinc-100 ${
                repeatNote
                  ? 'opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800'
                  : 'focus:bg-brutalist-yellow focus:text-black'
              }`}
            />
          </div>

          {/* Recent note suggestions — hidden when repeat mode is on */}
          {!repeatNote && recentNotes.length > 0 && (
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
