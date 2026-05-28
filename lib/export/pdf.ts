import { jsPDF } from 'jspdf'
import type { Session } from '@prisma/client'
import { secondsToHours } from '@/lib/utils/time'
import { formatDate, formatTime, formatCurrency, formatHours } from '@/lib/utils/format'
import { formatDateForInput } from '@/lib/utils/format'

export interface InvoiceOptions {
  sessions: Session[]
  start: Date
  end: Date
  hourlyRate: number
  fromEmail: string
  invoiceNumber: string
  clientName: string
  clientCompany: string
  clientAddress: string
  invoiceType: 'summary' | 'detailed'
}

interface DailyGroup {
  date: string
  totalSeconds: number
  sessions: Session[]
}

const BLACK = '#000000'
const YELLOW = '#FFFF00'
const WHITE = '#FFFFFF'
const LIGHT_GRAY = '#F5F5F5'

function setBlack(doc: jsPDF): void {
  doc.setTextColor(0, 0, 0)
  doc.setDrawColor(0, 0, 0)
}

function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, hex: string): void {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  doc.setFillColor(r, g, b)
  doc.rect(x, y, w, h, 'F')
}

function strokeRect(doc: jsPDF, x: number, y: number, w: number, h: number, lineWidth = 2): void {
  doc.setLineWidth(lineWidth)
  setBlack(doc)
  doc.rect(x, y, w, h, 'S')
}

function groupByDay(sessions: Session[]): DailyGroup[] {
  const dayMap = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = formatDateForInput(new Date(s.startTime))
    if (!dayMap.has(key)) dayMap.set(key, [])
    dayMap.get(key)!.push(s)
  }
  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySessions]) => ({
      date,
      totalSeconds: daySessions.reduce((sum, s) => sum + (s.duration ?? 0), 0),
      sessions: daySessions,
    }))
}

function drawHeader(doc: jsPDF, margin: number, contentW: number, y: number): number {
  const pageW = doc.internal.pageSize.getWidth()
  const headerH = 56
  fillRect(doc, margin, y, contentW, headerH, BLACK)
  strokeRect(doc, margin, y, contentW, headerH, 2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 0)
  doc.text('MOCHI TIMER', margin + 16, y + 35)

  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('INVOICE', pageW - margin - 16, y + 37, { align: 'right' })

  y += headerH
  fillRect(doc, margin, y, contentW, 6, YELLOW)
  strokeRect(doc, margin, y, contentW, 6, 2)
  return y + 6
}

function drawMeta(
  doc: jsPDF,
  margin: number,
  contentW: number,
  y: number,
  invNum: string,
  invDate: string,
  periodStr: string,
  invoiceType: 'summary' | 'detailed'
): number {
  const metaH = 88
  const halfW = contentW / 2
  const midY = y + metaH / 2

  fillRect(doc, margin, y, contentW, metaH, LIGHT_GRAY)
  strokeRect(doc, margin, y, contentW, metaH, 2)

  // Dividers
  doc.setLineWidth(1)
  setBlack(doc)
  doc.line(margin + halfW, y, margin + halfW, y + metaH)
  doc.line(margin, midY, margin + contentW, midY)

  const leftX  = margin + 14
  const rightX = margin + halfW + 14
  const labelOffset = 15
  const valueOffset = 32

  // Top-left: INVOICE #
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setBlack(doc)
  doc.text('INVOICE #', leftX, y + labelOffset)
  doc.setFontSize(8)
  doc.text(doc.splitTextToSize(invNum, halfW - 28)[0], leftX, y + valueOffset)

  // Top-right: DATE ISSUED
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('DATE ISSUED', rightX, y + labelOffset)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(invDate, rightX, y + valueOffset)

  // Bottom-left: TYPE
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setBlack(doc)
  doc.text('TYPE', leftX, midY + labelOffset)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(invoiceType === 'summary' ? 'Hours Summary' : 'Detailed Log', leftX, midY + valueOffset)

  // Bottom-right: PERIOD
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('PERIOD', rightX, midY + labelOffset)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(periodStr, rightX, midY + valueOffset)

  return y + metaH
}

function drawFromTo(
  doc: jsPDF,
  margin: number,
  contentW: number,
  y: number,
  fromEmail: string,
  clientName: string,
  clientCompany: string,
  clientAddress: string
): number {
  const halfW = contentW / 2
  const col1 = margin + 14
  const col2 = margin + halfW + 14

  // Measure TO content to size the box dynamically
  const toLines: string[] = []
  if (clientName) toLines.push(clientName)
  if (clientCompany) toLines.push(clientCompany)
  if (clientAddress) toLines.push(...clientAddress.split('\n').filter(Boolean))
  if (toLines.length === 0) toLines.push('—')

  const lineH = 13
  const contentLines = Math.max(toLines.length, 1)
  const fromToH = Math.max(64, 26 + contentLines * lineH + 10)

  // FROM box
  fillRect(doc, margin, y, halfW, fromToH, WHITE)
  strokeRect(doc, margin, y, halfW, fromToH, 2)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  setBlack(doc)
  doc.text('FROM', col1, y + 13)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(doc.splitTextToSize(fromEmail, halfW - 28), col1, y + 27)

  // TO box
  fillRect(doc, margin + halfW, y, halfW, fromToH, WHITE)
  strokeRect(doc, margin + halfW, y, halfW, fromToH, 2)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('TO', col2, y + 13)

  let ty = y + 27
  if (clientName) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(clientName, col2, ty)
    ty += lineH
  }
  if (clientCompany) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(clientCompany, col2, ty)
    ty += lineH
  }
  if (clientAddress) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    const addrLines = clientAddress.split('\n').filter(Boolean)
    for (const line of addrLines) {
      doc.text(line, col2, ty)
      ty += lineH
    }
    setBlack(doc)
  }
  if (!clientName && !clientCompany && !clientAddress) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('—', col2, y + 27)
  }

  return y + fromToH
}

function drawTotals(
  doc: jsPDF,
  margin: number,
  contentW: number,
  pageH: number,
  y: number,
  grandTotalHours: number,
  grandTotalAmount: number,
  hourlyRate: number
): number {
  const pageW = doc.internal.pageSize.getWidth()
  const totalsX = margin + contentW * 0.55
  const totalsW = contentW * 0.45
  const labelX = totalsX + 14
  const valueX = pageW - margin - 14

  if (y + 100 > pageH - 48) {
    doc.addPage()
    y = margin
  }

  y += 8

  const thH = 28
  fillRect(doc, totalsX, y, totalsW, thH, LIGHT_GRAY)
  strokeRect(doc, totalsX, y, totalsW, thH, 2)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  setBlack(doc)
  doc.text('TOTAL HOURS', labelX, y + 18)
  doc.setFontSize(10)
  doc.text(formatHours(grandTotalHours), valueX, y + 18, { align: 'right' })
  y += thH

  if (hourlyRate > 0) {
    const rateH = 26
    fillRect(doc, totalsX, y, totalsW, rateH, LIGHT_GRAY)
    strokeRect(doc, totalsX, y, totalsW, rateH, 2)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('RATE', labelX, y + 17)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${formatCurrency(hourlyRate)} / hr`, valueX, y + 17, { align: 'right' })
    y += rateH

    const amtH = 36
    fillRect(doc, totalsX, y, totalsW, amtH, YELLOW)
    strokeRect(doc, totalsX, y, totalsW, amtH, 2)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    setBlack(doc)
    doc.text('AMOUNT DUE', labelX, y + 23)
    doc.setFontSize(14)
    doc.text(formatCurrency(grandTotalAmount), valueX, y + 24, { align: 'right' })
    y += amtH
  }

  return y
}

function drawTableHeader(
  doc: jsPDF,
  margin: number,
  contentW: number,
  y: number,
  cols: { label: string; x: number; align?: 'left' | 'right' }[],
  pageW: number
): number {
  const tableHeaderH = 26
  fillRect(doc, margin, y, contentW, tableHeaderH, BLACK)
  strokeRect(doc, margin, y, contentW, tableHeaderH, 2)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  for (const col of cols) {
    const x = col.align === 'right' ? pageW - margin - 14 : col.x
    doc.text(col.label, x, y + 17, { align: col.align === 'right' ? 'right' : 'left' })
  }
  return y + tableHeaderH
}

// ─── HOURS SUMMARY ───────────────────────────────────────────────────────────

function drawSummaryTable(
  doc: jsPDF,
  margin: number,
  contentW: number,
  pageH: number,
  startY: number,
  dailyGroups: DailyGroup[],
  hourlyRate: number,
  pageW: number
): number {
  const colDate = margin + 14
  const colDesc = margin + 130
  const colHours = margin + contentW * 0.60
  const colRate = margin + contentW * 0.74

  const cols = [
    { label: 'DATE', x: colDate },
    { label: 'DESCRIPTION', x: colDesc },
    { label: 'HOURS', x: colHours },
    ...(hourlyRate > 0
      ? [{ label: 'RATE', x: colRate }, { label: 'AMOUNT', x: 0, align: 'right' as const }]
      : []),
  ]

  let y = drawTableHeader(doc, margin, contentW, startY, cols, pageW)
  let rowIndex = 0

  for (const day of dailyGroups) {
    const rowH = 28
    if (y + rowH > pageH - 120) { doc.addPage(); y = margin }

    const dayDate = new Date(day.date + 'T12:00:00')
    const dayHours = secondsToHours(day.totalSeconds)
    const allNotes = day.sessions.map((s) => s.notes).filter(Boolean).join('; ')
    const description = allNotes || 'Consulting services'

    fillRect(doc, margin, y, contentW, rowH, rowIndex % 2 === 0 ? WHITE : LIGHT_GRAY)
    strokeRect(doc, margin, y, contentW, rowH, 1)
    setBlack(doc)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(formatDate(dayDate), colDate, y + 18)
    doc.text(doc.splitTextToSize(description, colHours - colDesc - 8)[0], colDesc, y + 18)

    doc.setFont('helvetica', 'bold')
    doc.text(formatHours(dayHours), colHours, y + 18)

    if (hourlyRate > 0) {
      doc.setFont('helvetica', 'normal')
      doc.text(`${formatCurrency(hourlyRate)}/hr`, colRate, y + 18)
      doc.setFont('helvetica', 'bold')
      doc.text(formatCurrency(dayHours * hourlyRate), pageW - margin - 14, y + 18, { align: 'right' })
    }

    rowIndex++
    y += rowH
  }

  if (dailyGroups.length === 0) {
    const rowH = 36
    fillRect(doc, margin, y, contentW, rowH, LIGHT_GRAY)
    strokeRect(doc, margin, y, contentW, rowH, 1)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setBlack(doc)
    doc.text('No sessions in this period.', colDate, y + 22)
    y += rowH
  }

  return y
}

// ─── DETAILED LOG ────────────────────────────────────────────────────────────

function drawDetailedTable(
  doc: jsPDF,
  margin: number,
  contentW: number,
  pageH: number,
  startY: number,
  dailyGroups: DailyGroup[],
  hourlyRate: number,
  pageW: number
): number {
  const colDate  = margin + 14
  const colIn    = margin + 110
  const colOut   = margin + 190
  const colDur   = margin + contentW * 0.60
  const colNotes = margin + contentW * 0.73

  const cols = [
    { label: 'DATE', x: colDate },
    { label: 'IN', x: colIn },
    { label: 'OUT', x: colOut },
    { label: 'DURATION', x: colDur },
    { label: 'NOTES', x: colNotes },
    ...(hourlyRate > 0 ? [{ label: 'AMOUNT', x: 0, align: 'right' as const }] : []),
  ]

  let y = drawTableHeader(doc, margin, contentW, startY, cols, pageW)
  let rowIndex = 0

  for (const day of dailyGroups) {
    // Day header row
    if (y + 22 > pageH - 120) { doc.addPage(); y = margin }
    const dayDate = new Date(day.date + 'T12:00:00')
    const dayHours = secondsToHours(day.totalSeconds)

    fillRect(doc, margin, y, contentW, 22, LIGHT_GRAY)
    strokeRect(doc, margin, y, contentW, 22, 1)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    setBlack(doc)
    doc.text(formatDate(dayDate).toUpperCase(), colDate, y + 15)
    doc.text(`${formatHours(dayHours)} total`, pageW - margin - 14, y + 15, { align: 'right' })
    y += 22

    // Session rows
    for (const s of day.sessions) {
      const rowH = 24
      if (y + rowH > pageH - 120) { doc.addPage(); y = margin }

      const sIn  = new Date(s.startTime)
      const sOut = s.endTime ? new Date(s.endTime) : null
      const dur  = s.duration ? formatHours(secondsToHours(s.duration)) : '—'

      fillRect(doc, margin, y, contentW, rowH, rowIndex % 2 === 0 ? WHITE : '#FAFAFA')
      strokeRect(doc, margin, y, contentW, rowH, 0.5)
      setBlack(doc)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(formatTime(sIn), colIn, y + 16)
      doc.text(sOut ? formatTime(sOut) : '—', colOut, y + 16)

      doc.setFont('helvetica', 'bold')
      doc.text(dur, colDur, y + 16)
      doc.setFont('helvetica', 'normal')

      if (s.notes) {
        const noteLines = doc.splitTextToSize(s.notes, pageW - margin - 14 - colNotes - 8)
        doc.text(noteLines[0], colNotes, y + 16)
      }

      if (hourlyRate > 0 && s.duration) {
        const amt = secondsToHours(s.duration) * hourlyRate
        doc.setFont('helvetica', 'bold')
        doc.text(formatCurrency(amt), pageW - margin - 14, y + 16, { align: 'right' })
      }

      rowIndex++
      y += rowH
    }

    y += 4 // breathing room between days
  }

  if (dailyGroups.length === 0) {
    const rowH = 36
    fillRect(doc, margin, y, contentW, rowH, LIGHT_GRAY)
    strokeRect(doc, margin, y, contentW, rowH, 1)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setBlack(doc)
    doc.text('No sessions in this period.', colDate, y + 22)
    y += rowH
  }

  return y
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function generateInvoicePDF(opts: InvoiceOptions): Uint8Array {
  const { sessions, start, end, hourlyRate, fromEmail, invoiceNumber, clientName, clientCompany, clientAddress, invoiceType } = opts

  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentW = pageW - margin * 2

  const dailyGroups = groupByDay(sessions)
  const grandTotalSeconds = dailyGroups.reduce((sum, d) => sum + d.totalSeconds, 0)
  const grandTotalHours = secondsToHours(grandTotalSeconds)
  const grandTotalAmount = grandTotalHours * hourlyRate

  const invNum = invoiceNumber || `INV-${formatDateForInput(end).replace(/-/g, '')}`
  const invDate = formatDate(new Date())
  const periodStr = `${formatDate(start)} — ${formatDate(end)}`

  let y = margin
  y = drawHeader(doc, margin, contentW, y)
  y = drawMeta(doc, margin, contentW, y, invNum, invDate, periodStr, invoiceType)
  y = drawFromTo(doc, margin, contentW, y, fromEmail, clientName, clientCompany, clientAddress)

  if (invoiceType === 'summary') {
    y = drawSummaryTable(doc, margin, contentW, pageH, y, dailyGroups, hourlyRate, pageW)
  } else {
    y = drawDetailedTable(doc, margin, contentW, pageH, y, dailyGroups, hourlyRate, pageW)
  }

  drawTotals(doc, margin, contentW, pageH, y, grandTotalHours, grandTotalAmount, hourlyRate)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 150, 150)
  doc.text('Generated by Mochi Timer', margin, pageH - 28)
  doc.text(invDate, pageW - margin, pageH - 28, { align: 'right' })

  return doc.output('arraybuffer') as unknown as Uint8Array
}
