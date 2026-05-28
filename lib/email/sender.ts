import { Resend } from 'resend'
import { weeklySummaryHTML } from './templates'
import { getSessionsByDateRange } from '@/lib/db/sessions'
import { getAllUsers } from '@/lib/db/users'
import { secondsToHours } from '@/lib/utils/time'
import { formatDateForInput } from '@/lib/utils/format'
import { logger } from '@/lib/utils/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWeeklySummaryToAll(weekStart: Date, weekEnd: Date): Promise<void> {
  const users = await getAllUsers()
  const eligible = users.filter((u) => u.emailSummary && u.email)

  for (const user of eligible) {
    try {
      const sessions = await getSessionsByDateRange(user.id, weekStart, weekEnd)

      const dayMap = new Map<string, number>()
      for (const s of sessions) {
        if (!s.duration) continue
        const key = formatDateForInput(new Date(s.startTime))
        dayMap.set(key, (dayMap.get(key) ?? 0) + s.duration)
      }

      const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0)
      const daySummaries = Array.from(dayMap.entries()).map(([date, secs]) => ({
        date,
        totalSeconds: secs,
      }))

      const html = weeklySummaryHTML({
        userEmail: user.email,
        weekStart,
        weekEnd,
        totalSeconds,
        hourlyRate: user.hourlyRate,
        daySummaries,
      })

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com',
        to: user.email,
        subject: `Weekly summary — ${formatHoursShort(secondsToHours(totalSeconds))} logged`,
        html,
      })

      logger.info('Weekly summary sent', { userId: user.id, email: user.email })
    } catch (err) {
      logger.error('Failed to send weekly summary', { userId: user.id, error: String(err) })
    }
  }
}

function formatHoursShort(hours: number): string {
  return `${hours.toFixed(1)}h`
}
