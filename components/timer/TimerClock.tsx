'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TimerClockProps {
  timezone: string
}

interface ClockData {
  time: string
  greeting: string
  tzAbbr: string
}

function buildClockData(timezone: string): ClockData {
  const now = new Date()

  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(now),
    10
  )

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now)

  const tzAbbr =
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''

  let greeting: string
  if (hour >= 5 && hour < 12) greeting = 'Good morning'
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
  else if (hour >= 17 && hour < 21) greeting = 'Good evening'
  else greeting = 'Good night'

  return { time, greeting, tzAbbr }
}

export function TimerClock({ timezone }: TimerClockProps) {
  const [clock, setClock] = useState<ClockData | null>(null)
  const [spinKey, setSpinKey] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const update = () => setClock(buildClockData(timezone))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [timezone])

  function handleSync() {
    setSpinKey((k) => k + 1)
    router.refresh()
  }

  if (!clock) return null

  return (
    <div className="flex items-center justify-between mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {clock.greeting} — {clock.time} {clock.tzAbbr}
      </p>
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
  )
}
