'use client'

import { useSessions } from '@/lib/hooks/useSessions'
import { SessionItem } from '@/components/timer/SessionItem'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { EmptyState } from '@/components/shared/EmptyState'
import { secondsToHours } from '@/lib/utils/time'
import { formatHours, formatCurrency, formatDate } from '@/lib/utils/format'

interface DayDetailProps {
  date: string
  hourlyRate: number
}

export function DayDetail({ date, hourlyRate }: DayDetailProps) {
  const { sessions, loading, error, refetch } = useSessions(date)

  const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0)
  const totalHours = secondsToHours(totalSeconds)
  const estimatedPay = totalHours * hourlyRate

  const displayDate = formatDate(new Date(date + 'T12:00:00'))

  return (
    <div className="border-[3px] border-black p-5 shadow-brutal bg-white">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-4">{displayDate}</h3>

      {loading && (
        <div className="flex justify-center py-6">
          <LoadingSpinner size="lg" />
        </div>
      )}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <div className="flex gap-8 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">HOURS</p>
              <p className="text-2xl font-mono-brutal font-bold">{formatHours(totalHours)}</p>
            </div>
            {hourlyRate > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">EST. PAY</p>
                <p className="text-2xl font-mono-brutal font-bold">{formatCurrency(estimatedPay)}</p>
              </div>
            )}
          </div>

          {sessions.length === 0 ? (
            <EmptyState title="No sessions" />
          ) : (
            <ul className="border-[3px] border-black">
              {sessions.map((s) => <SessionItem key={s.id} session={s} />)}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
