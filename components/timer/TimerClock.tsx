'use client'

import { useState, useEffect } from 'react'

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

  useEffect(() => {
    const update = () => setClock(buildClockData(timezone))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [timezone])

  if (!clock) return null

  return (
    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
      {clock.greeting} — {clock.time} {clock.tzAbbr}
    </p>
  )
}
