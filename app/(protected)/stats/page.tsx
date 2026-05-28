import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/db/users'
import { getSessionsByDateRange } from '@/lib/db/sessions'
import { StatsCard } from '@/components/stats/StatsCard'
import { HoursChart } from '@/components/stats/HoursChart'
import { PayPeriodSelector } from '@/components/stats/PayPeriodSelector'
import { getPayPeriodBounds, secondsToHours, secondsToDisplay } from '@/lib/utils/time'
import { formatHours, formatCurrency, formatDateForInput } from '@/lib/utils/format'
import type { Session } from '@prisma/client'

function aggregateBars(sessions: Session[], start: Date, end: Date) {
  const map = new Map<string, number>()
  const cursor = new Date(start)
  while (cursor <= end) {
    map.set(formatDateForInput(cursor), 0)
    cursor.setDate(cursor.getDate() + 1)
  }
  for (const s of sessions) {
    if (!s.duration) continue
    const key = formatDateForInput(new Date(s.startTime))
    map.set(key, (map.get(key) ?? 0) + s.duration)
  }
  return Array.from(map.entries()).map(([date, secs]) => ({
    date,
    hours: Math.round(secondsToHours(secs) * 100) / 100,
  }))
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const params = await searchParams
  const period = params.period === 'pay-period' ? 'pay-period' : 'week'

  const dbUser = await getUserById(user.id)
  const hourlyRate = dbUser?.hourlyRate ?? 0
  const payPeriodStart = dbUser?.payPeriodStart ?? 1

  const now = new Date()
  const { start: ppStart, end: ppEnd } = getPayPeriodBounds(payPeriodStart, now)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const chartStart = period === 'pay-period' ? ppStart : weekStart
  const chartEnd = period === 'pay-period' ? ppEnd : weekEnd

  const [weekSessions, ppSessions] = await Promise.all([
    getSessionsByDateRange(user.id, weekStart, weekEnd),
    getSessionsByDateRange(user.id, ppStart, ppEnd),
  ])

  const weekSeconds = weekSessions.reduce((s, x) => s + (x.duration ?? 0), 0)
  const ppSeconds = ppSessions.reduce((s, x) => s + (x.duration ?? 0), 0)
  const allSessions = [...new Map([...weekSessions, ...ppSessions].map((s) => [s.id, s])).values()]
  const longestSeconds = allSessions.reduce((max, s) => Math.max(max, s.duration ?? 0), 0)
  const chartSessions = period === 'pay-period' ? ppSessions : weekSessions

  const totalHoursWeek = secondsToHours(weekSeconds)
  const totalHoursPP = secondsToHours(ppSeconds)

  const dailyBars = aggregateBars(chartSessions, chartStart, chartEnd)
  const daysWithHours = dailyBars.filter((d) => d.hours > 0).length
  const avgHours = daysWithHours > 0 ? totalHoursWeek / 7 : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-widest">STATS</h1>
        <PayPeriodSelector />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatsCard
          label="Hours this week"
          value={formatHours(totalHoursWeek)}
          sub={hourlyRate > 0 ? `Est. ${formatCurrency(totalHoursWeek * hourlyRate)}` : undefined}
        />
        <StatsCard
          label="Hours this pay period"
          value={formatHours(totalHoursPP)}
          sub={hourlyRate > 0 ? `Est. ${formatCurrency(totalHoursPP * hourlyRate)}` : undefined}
        />
        <StatsCard label="Daily average" value={formatHours(avgHours)} />
        <StatsCard label="Longest session" value={secondsToDisplay(longestSeconds)} />
      </div>

      <h2 className="text-xs font-bold uppercase tracking-widest mb-4 pb-3 border-b-[3px] border-black">
        HOURS PER DAY
      </h2>
      <HoursChart data={dailyBars} />
    </div>
  )
}
