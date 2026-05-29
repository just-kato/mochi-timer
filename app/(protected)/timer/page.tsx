import { createClient } from '@/lib/supabase/server'
import { getActiveSession, getSessionsByDay, getRecentNoteSuggestions } from '@/lib/db/sessions'
import { getUserById } from '@/lib/db/users'
import { ActiveTimer } from '@/components/timer/ActiveTimer'
import { TodaySessions } from '@/components/timer/TodaySessions'
import { TimerClock } from '@/components/timer/TimerClock'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { TimerCrashFallback } from '@/components/timer/TimerCrashFallback'
import { OfflineIndicator } from '@/components/shared/OfflineIndicator'
import { SyncIndicator } from '@/components/shared/SyncIndicator'

export default async function TimerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [activeSession, todaySessions, dbUser, recentNotes] = await Promise.all([
    getActiveSession(user.id),
    getSessionsByDay(user.id, new Date()),
    getUserById(user.id),
    getRecentNoteSuggestions(user.id),
  ])

  const initialSession = activeSession
    ? {
        id: activeSession.id,
        startTime: activeSession.startTime.toISOString(),
        synced: true,
      }
    : null

  const timezone = dbUser?.timezone ?? 'America/New_York'

  return (
    <>
      <OfflineIndicator />
      <SyncIndicator />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <TimerClock timezone={timezone} />

        <ErrorBoundary fallback={<TimerCrashFallback />}>
          <ActiveTimer initialSession={initialSession} recentNotes={recentNotes} />
        </ErrorBoundary>

        <section className="mt-12">
          <TodaySessions initialSessions={todaySessions} />
        </section>
      </div>
    </>
  )
}
