import type { Session } from '@prisma/client'
import { SessionItem } from './SessionItem'
import { EmptyState } from '@/components/shared/EmptyState'

interface SessionListProps {
  sessions: Session[]
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return <EmptyState title="No sessions today" description="Start the timer to log your first session." />
  }

  return (
    <ul className="border-[3px] border-black">
      {sessions.map((session) => (
        <SessionItem key={session.id} session={session} />
      ))}
    </ul>
  )
}
