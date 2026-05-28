import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/db/users'
import { getSessionsByDateRange } from '@/lib/db/sessions'
import { getPayPeriodBounds, secondsToHours } from '@/lib/utils/time'
import { formatDateForInput } from '@/lib/utils/format'
import type { Session } from '@prisma/client'

interface DailyBar {
  date: string
  hours: number
}

interface StatsResponse {
  totalHoursWeek: number
  totalHoursPayPeriod: number
  estimatedPayWeek: number
  estimatedPayPayPeriod: number
  dailyAvgHours: number
  longestSessionSeconds: number
  dailyBars: DailyBar[]
  hourlyRate: number
  payPeriodStart: number
}

function aggregateBars(sessions: Session[], start: Date, end: Date): DailyBar[] {
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

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await getUserById(user.id)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')

  const payPeriod = getPayPeriodBounds(dbUser.payPeriodStart)

  // Week bounds (Mon–Sun regardless of pay period)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const chartStart = startParam ? new Date(startParam) : payPeriod.start
  const chartEnd = endParam ? new Date(endParam) : payPeriod.end

  const [weekSessions, payPeriodSessions, chartSessions] = await Promise.all([
    getSessionsByDateRange(user.id, weekStart, weekEnd),
    getSessionsByDateRange(user.id, payPeriod.start, payPeriod.end),
    getSessionsByDateRange(user.id, chartStart, chartEnd),
  ])

  const weekSeconds = weekSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0)
  const payPeriodSeconds = payPeriodSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0)
  const allSessions = [...weekSessions, ...payPeriodSessions]
  const longestSessionSeconds = allSessions.reduce(
    (max, s) => Math.max(max, s.duration ?? 0),
    0
  )

  const daysInWeek = 7
  const totalHoursWeek = secondsToHours(weekSeconds)
  const totalHoursPayPeriod = secondsToHours(payPeriodSeconds)

  const response: StatsResponse = {
    totalHoursWeek: Math.round(totalHoursWeek * 100) / 100,
    totalHoursPayPeriod: Math.round(totalHoursPayPeriod * 100) / 100,
    estimatedPayWeek: Math.round(totalHoursWeek * dbUser.hourlyRate * 100) / 100,
    estimatedPayPayPeriod: Math.round(totalHoursPayPeriod * dbUser.hourlyRate * 100) / 100,
    dailyAvgHours: Math.round((totalHoursWeek / daysInWeek) * 100) / 100,
    longestSessionSeconds,
    dailyBars: aggregateBars(chartSessions, chartStart, chartEnd),
    hourlyRate: dbUser.hourlyRate,
    payPeriodStart: dbUser.payPeriodStart,
  }

  return NextResponse.json(response)
}
