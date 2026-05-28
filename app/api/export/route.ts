import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserById } from '@/lib/db/users'
import { getSessionsByDateRange } from '@/lib/db/sessions'
import { sessionsToCSV } from '@/lib/export/csv'
import { generateInvoicePDF } from '@/lib/export/pdf'
import { startOfDay, endOfDay } from '@/lib/utils/time'

function parseLocalDate(param: string): Date | null {
  const parts = param.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return null
  const [y, m, d] = parts
  return new Date(y, m - 1, d)
}

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  const invoiceNumber = searchParams.get('invoiceNumber') ?? ''
  const clientName = searchParams.get('clientName') ?? ''
  const clientCompany = searchParams.get('clientCompany') ?? ''
  const clientAddress = searchParams.get('clientAddress') ?? ''
  const invoiceTypeParam = searchParams.get('invoiceType')
  const invoiceType: 'summary' | 'detailed' =
    invoiceTypeParam === 'detailed' ? 'detailed' : 'summary'

  if (format !== 'csv' && format !== 'pdf') {
    return NextResponse.json({ error: 'format must be csv or pdf' }, { status: 400 })
  }
  if (!startParam || !endParam) {
    return NextResponse.json({ error: 'start and end are required' }, { status: 400 })
  }

  // Parse as local midnight/end-of-day — new Date("YYYY-MM-DD") is UTC midnight which
  // shifts to the prior day in UTC- timezones, cutting off sessions on the boundary dates.
  const startLocal = parseLocalDate(startParam)
  const endLocal = parseLocalDate(endParam)
  if (!startLocal || !endLocal) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }

  const start = startOfDay(startLocal)
  const end = endOfDay(endLocal)

  if (end < start) {
    return NextResponse.json({ error: 'end must be after start' }, { status: 400 })
  }

  const [dbUser, sessions] = await Promise.all([
    getUserById(user.id),
    getSessionsByDateRange(user.id, start, end),
  ])

  if (format === 'csv') {
    const csv = sessionsToCSV(sessions)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="mochi-time-${startParam}-${endParam}.csv"`,
      },
    })
  }

  const pdfBytes = generateInvoicePDF({
    sessions,
    start: startLocal,
    end: endLocal,
    hourlyRate: dbUser?.hourlyRate ?? 0,
    fromEmail: user.email ?? '',
    invoiceNumber,
    clientName,
    clientCompany,
    clientAddress,
    invoiceType,
  })

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${startParam}-${endParam}.pdf"`,
    },
  })
}
