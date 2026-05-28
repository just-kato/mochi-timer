'use client'

import { useState } from 'react'
import { DayDetail } from './DayDetail'
import { isToday, isFuture } from '@/lib/utils/time'
import { formatDateForInput } from '@/lib/utils/format'

interface DaySummary {
  date: string
  totalSeconds: number
}

interface CalendarGridProps {
  year: number
  month: number
  daySummaries: DaySummary[]
  hourlyRate: number
}

const DAY_LABELS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

export function CalendarGrid({ year, month, daySummaries, hourlyRate }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const summaryMap = new Map(daySummaries.map((d) => [d.date, d.totalSeconds]))

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalCells = startOffset + lastDay.getDate()
  const rows = Math.ceil(totalCells / 7)

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ]
  while (cells.length < rows * 7) cells.push(null)

  return (
    <div>
      <div className="grid grid-cols-7 bg-black gap-0.75 mb-0.75">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="bg-black text-white text-xs font-bold tracking-widest text-center py-3"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.75 bg-black">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-white h-16" />

          const date = new Date(year, month, day)
          const dateStr = formatDateForInput(date)
          const future = isFuture(date) && !isToday(date)
          const hasData = summaryMap.has(dateStr)
          const todayCell = isToday(date)
          const selected = selectedDate === dateStr

          return (
            <button
              key={i}
              onClick={() => !future && setSelectedDate(selected ? null : dateStr)}
              disabled={future}
              className={`h-16 flex flex-col items-center justify-center relative ${
                future
                  ? 'bg-white text-zinc-300 cursor-not-allowed'
                  : selected
                  ? 'bg-brutalist-yellow text-black cursor-pointer'
                  : todayCell
                  ? 'bg-black text-white cursor-pointer'
                  : 'bg-white text-black hover:bg-zinc-100 cursor-pointer'
              }`}
              aria-label={`${dateStr}${hasData ? ', has logged hours' : ''}${future ? ', not available' : ''}`}
              aria-pressed={selected}
            >
              <span className="text-sm font-mono-brutal font-bold">{day}</span>
              {hasData && (
                <span className={`absolute bottom-1.5 w-1.5 h-1.5 ${todayCell ? 'bg-white' : 'bg-black'}`} />
              )}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <DayDetail date={selectedDate} hourlyRate={hourlyRate} />
        </div>
      )}
    </div>
  )
}
