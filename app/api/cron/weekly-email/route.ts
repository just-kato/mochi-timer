import { NextResponse } from 'next/server'
import { sendWeeklySummaryToAll } from '@/lib/email/sender'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  // Always use current week: Monday 00:00:00 through today 23:59:59
  // On the scheduled Sunday cron this is the full Mon–Sun week;
  // on manual admin triggers it includes sessions logged so far this week.
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysFromMonday)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(now)
  weekEnd.setHours(23, 59, 59, 999)

  try {
    await sendWeeklySummaryToAll(weekStart, weekEnd)
    logger.info('Weekly email cron completed')
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Weekly email cron failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
