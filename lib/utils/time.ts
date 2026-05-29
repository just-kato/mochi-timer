export function durationSeconds(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
}

export function secondsToHours(seconds: number): number {
  return seconds / 3600
}

export function secondsToDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function toUTC(date: Date): string {
  return date.toISOString()
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

// Returns UTC start/end boundaries for a calendar day in the given IANA timezone.
// Uses noon-UTC as a probe to safely compute the timezone offset (avoids DST midnight edges).
export function dayBoundsInTimezone(dateStr: string, timezone: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const probeUTC = new Date(Date.UTC(y, m - 1, d, 12))
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(probeUTC)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10)
  const tzHour = get('hour') % 24
  const tzLocalAsUTC = Date.UTC(get('year'), get('month') - 1, get('day'), tzHour, get('minute'), get('second'))
  const offsetMs = tzLocalAsUTC - probeUTC.getTime()
  return {
    start: new Date(Date.UTC(y, m - 1, d, 0) - offsetMs),
    end: new Date(Date.UTC(y, m - 1, d + 1, 0) - offsetMs - 1),
  }
}

export function isFuture(date: Date): boolean {
  return date > new Date()
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function getPayPeriodBounds(
  payPeriodStart: number,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const day = referenceDate.getDay()
  const diff = (day - payPeriodStart + 7) % 7
  const start = new Date(referenceDate)
  start.setDate(referenceDate.getDate() - diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}
