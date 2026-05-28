import type { Session } from '@prisma/client'
import { formatTime, formatDate } from '@/lib/utils/format'
import { secondsToDisplay } from '@/lib/utils/time'

interface SessionItemProps {
  session: Session
}

export function SessionItem({ session }: SessionItemProps) {
  const start = new Date(session.startTime)
  const end = session.endTime ? new Date(session.endTime) : null
  const duration = session.duration ? secondsToDisplay(session.duration) : '—'

  return (
    <li className="py-4 px-4 border-b-[3px] border-black last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold font-mono-brutal">
            {formatTime(start)} — {end ? formatTime(end) : 'RUNNING'}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1">
            {formatDate(start)}
          </p>
          {session.notes && (
            <p className="text-xs mt-2 text-zinc-700">{session.notes}</p>
          )}
        </div>
        <span className="text-sm font-mono-brutal font-bold tabular-nums shrink-0">{duration}</span>
      </div>
    </li>
  )
}
