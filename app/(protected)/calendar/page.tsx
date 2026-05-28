import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/db/users'
import { getSessionsByDateRange } from '@/lib/db/sessions'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { formatDateForInput } from '@/lib/utils/format'
import { startOfDay, endOfDay } from '@/lib/utils/time'

function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  return {
    start: startOfDay(new Date(year, month, 1)),
    end: endOfDay(new Date(year, month + 1, 0)),
  }
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth()

  const { start, end } = getMonthBounds(year, month)
  const [dbUser, sessions] = await Promise.all([
    getUserById(user.id),
    getSessionsByDateRange(user.id, start, end),
  ])

  const dayMap = new Map<string, number>()
  for (const session of sessions) {
    if (!session.endTime || !session.duration) continue
    const dateStr = formatDateForInput(new Date(session.startTime))
    dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + session.duration)
  }
  const daySummaries = Array.from(dayMap.entries()).map(([date, totalSeconds]) => ({
    date,
    totalSeconds,
  }))

  const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  const prevMonth = month === 0 ? 11 : month - 1
  const prevYear = month === 0 ? year - 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear = month === 11 ? year + 1 : year
  const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest">CALENDAR</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/calendar?year=${prevYear}&month=${prevMonth}`}
            className="w-11 min-h-11 flex items-center justify-center border-[3px] border-black font-bold hover:bg-brutalist-yellow btn-brutal shadow-brutal-sm"
          >
            ←
          </a>
          <span className="text-xs font-bold uppercase tracking-widest w-44 text-center">{monthName}</span>
          {!isCurrentOrFuture ? (
            <a
              href={`/calendar?year=${nextYear}&month=${nextMonth}`}
              className="w-11 min-h-11 flex items-center justify-center border-[3px] border-black font-bold hover:bg-brutalist-yellow btn-brutal shadow-brutal-sm"
            >
              →
            </a>
          ) : (
            <span className="w-11 min-h-11 flex items-center justify-center border-[3px] border-black text-zinc-300 cursor-not-allowed">
              →
            </span>
          )}
        </div>
      </div>

      <CalendarGrid
        year={year}
        month={month}
        daySummaries={daySummaries}
        hourlyRate={dbUser?.hourlyRate ?? 0}
      />
    </div>
  )
}
