'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@prisma/client'
import { SessionItem } from './SessionItem'
import { EditSessionModal } from './EditSessionModal'
import { EmptyState } from '@/components/shared/EmptyState'

interface TodaySessionsProps {
  initialSessions: Session[]
}

export function TodaySessions({ initialSessions }: TodaySessionsProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  function handleSaved(updated: Session) {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setEditingSession(null)
  }

  function handleDeleted(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    router.refresh()
  }

  if (sessions.length === 0) {
    return <EmptyState title="No sessions today" description="Start the timer to log your first session." />
  }

  return (
    <>
      <ul className="border-[3px] border-black dark:border-zinc-700 max-h-100 overflow-y-auto">
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            onEdit={setEditingSession}
            onDeleted={handleDeleted}

          />
        ))}
      </ul>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
