import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserById, updateUserSettings } from '@/lib/db/users'

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await getUserById(user.id)
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    hourlyRate: dbUser.hourlyRate,
    payPeriodStart: dbUser.payPeriodStart,
    emailSummary: dbUser.emailSummary,
    timezone: dbUser.timezone,
  })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { hourlyRate?: unknown; payPeriodStart?: unknown; emailSummary?: unknown; timezone?: unknown }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const update: { hourlyRate?: number; payPeriodStart?: number; emailSummary?: boolean; timezone?: string } = {}

  if (body.hourlyRate !== undefined) {
    if (typeof body.hourlyRate !== 'number' || body.hourlyRate < 0) {
      return NextResponse.json({ error: 'hourlyRate must be a non-negative number' }, { status: 400 })
    }
    update.hourlyRate = body.hourlyRate
  }

  if (body.payPeriodStart !== undefined) {
    if (typeof body.payPeriodStart !== 'number' || body.payPeriodStart < 0 || body.payPeriodStart > 6) {
      return NextResponse.json({ error: 'payPeriodStart must be 0–6' }, { status: 400 })
    }
    update.payPeriodStart = body.payPeriodStart
  }

  if (body.emailSummary !== undefined) {
    if (typeof body.emailSummary !== 'boolean') {
      return NextResponse.json({ error: 'emailSummary must be boolean' }, { status: 400 })
    }
    update.emailSummary = body.emailSummary
  }

  if (body.timezone !== undefined) {
    if (typeof body.timezone !== 'string' || !isValidTimezone(body.timezone)) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
    }
    update.timezone = body.timezone
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await updateUserSettings(user.id, update)
  return NextResponse.json({
    hourlyRate: updated.hourlyRate,
    payPeriodStart: updated.payPeriodStart,
    emailSummary: updated.emailSummary,
    timezone: updated.timezone,
  })
}
