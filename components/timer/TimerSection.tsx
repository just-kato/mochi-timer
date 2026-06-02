'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TimerClock } from './TimerClock'
import { ActiveTimer } from './ActiveTimer'
import type { LocalSession } from '@/lib/indexeddb/client'

interface TimerSectionProps {
  timezone: string
  initialSession: LocalSession | null
  recentNotes: string[]
}

export function TimerSection({ timezone, initialSession, recentNotes }: TimerSectionProps) {
  const router = useRouter()
  const [spinKey, setSpinKey] = useState(0)
  const [running, setRunning] = useState(!!initialSession)
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const [abandonLoading, setAbandonLoading] = useState(false)
  const abandonRef = useRef<(() => Promise<void>) | null>(null)

  function handleSync() {
    setSpinKey((k) => k + 1)
    router.refresh()
  }

  const handleRunningChange = useCallback((r: boolean) => {
    setRunning(r)
    if (!r) setConfirmAbandon(false)
  }, [])

  async function handleAbandon() {
    if (!abandonRef.current) return
    setAbandonLoading(true)
    await abandonRef.current()
    setAbandonLoading(false)
    setConfirmAbandon(false)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <TimerClock timezone={timezone} />

        <div className="flex items-center gap-2">
          {confirmAbandon ? (
            <>
              <span className="text-xs font-bold uppercase tracking-widest text-brutalist-red">Abandon?</span>
              <button
                type="button"
                onClick={() => void handleAbandon()}
                disabled={abandonLoading}
                title="Discard this session without saving"
                className="btn-brutal min-h-0! min-w-0! h-6 px-2 text-xs font-bold uppercase tracking-widest border-[3px] border-black bg-black text-brutalist-yellow disabled:opacity-50"
              >
                {abandonLoading ? '…' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAbandon(false)}
                title="Keep the timer running"
                className="min-h-0! min-w-0! text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-zinc-100 underline"
              >
                No
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmAbandon(true)}
              disabled={!running}
              title={running ? 'Abandon session — discards time without saving' : 'No active session'}
              aria-label="Abandon session"
              className="text-zinc-300 dark:text-zinc-600 hover:text-brutalist-red dark:hover:text-brutalist-red disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={handleSync}
            aria-label="Sync sessions"
            title="Refresh session data"
            className="text-zinc-400 hover:text-black dark:hover:text-zinc-100 transition-colors"
          >
            <svg key={spinKey} xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={spinKey > 0 ? 'spin-once' : ''}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      <ActiveTimer
        initialSession={initialSession}
        recentNotes={recentNotes}
        onRunningChange={handleRunningChange}
        abandonRef={abandonRef}
      />
    </>
  )
}
