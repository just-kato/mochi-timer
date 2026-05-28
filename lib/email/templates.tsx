import { secondsToHours } from '@/lib/utils/time'
import { formatHours, formatCurrency, formatDate } from '@/lib/utils/format'

interface DaySummary {
  date: string
  totalSeconds: number
}

interface WeeklySummaryProps {
  userEmail: string
  weekStart: Date
  weekEnd: Date
  totalSeconds: number
  hourlyRate: number
  daySummaries: DaySummary[]
}

export function weeklySummaryHTML({
  userEmail,
  weekStart,
  weekEnd,
  totalSeconds,
  hourlyRate,
  daySummaries,
}: WeeklySummaryProps): string {
  const totalHours = secondsToHours(totalSeconds)
  const estimatedPay = totalHours * hourlyRate
  const weekRange = `${formatDate(weekStart)} — ${formatDate(weekEnd)}`

  const dayRows = daySummaries
    .map((d) => {
      const date = new Date(d.date + 'T12:00:00')
      const hours = secondsToHours(d.totalSeconds)
      return `
      <tr>
        <td style="padding:6px 0;color:#52525b;font-size:13px;">${formatDate(date)}</td>
        <td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px;">${formatHours(hours)}</td>
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,sans-serif;background:#f9f9f9;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:6px;padding:32px;">
    <h1 style="font-size:20px;font-weight:700;margin:0 0 4px;">Weekly Time Summary</h1>
    <p style="color:#71717a;font-size:13px;margin:0 0 24px;">${weekRange}</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tbody>${dayRows}</tbody>
    </table>

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 16px;">

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tbody>
        <tr>
          <td style="font-weight:700;font-size:14px;padding:4px 0;">Total hours</td>
          <td style="text-align:right;font-weight:700;font-size:14px;">${formatHours(totalHours)}</td>
        </tr>
        ${
          hourlyRate > 0
            ? `<tr>
          <td style="color:#71717a;font-size:13px;padding:4px 0;">Estimated pay</td>
          <td style="text-align:right;color:#71717a;font-size:13px;">${formatCurrency(estimatedPay)}</td>
        </tr>`
            : ''
        }
      </tbody>
    </table>

    <p style="color:#a1a1aa;font-size:11px;margin:0;">
      Sent to ${userEmail} by Mochi Timer.
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#a1a1aa;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`
}
