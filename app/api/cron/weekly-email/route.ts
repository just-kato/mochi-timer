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
  // Get the most recently completed week (Mon–Sun)
  const dayOfWeek = now.getDay() // 0=Sun
  // If triggered on Sunday night, the "week" is Mon–Sun of this week
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() - dayOfWeek) // back to Sunday
  weekEnd.setHours(23, 59, 59, 999)
  const weekStart = new Date(weekEnd)
  weekStart.setDate(weekEnd.getDate() - 6) // back to Monday
  weekStart.setHours(0, 0, 0, 0)

  try {
    await sendWeeklySummaryToAll(weekStart, weekEnd)
    logger.info('Weekly email cron completed')
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('Weekly email cron failed', { error: String(err) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
