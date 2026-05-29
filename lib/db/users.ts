import type { User } from '@prisma/client'
import { createServiceClient } from '@/lib/supabase/server'

interface SupabaseUserRow {
  id: string
  email: string
  role: string
  hourlyRate: number
  payPeriodStart: number
  emailSummary: boolean
  timezone: string
  inviteCount: number
  inviteWindowStart: string | null
  createdAt: string
  updatedAt: string
}

function toUTCDate(s: string): Date {
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z')
}

function mapUser(row: SupabaseUserRow): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    hourlyRate: row.hourlyRate,
    payPeriodStart: row.payPeriodStart,
    emailSummary: row.emailSummary,
    timezone: row.timezone,
    inviteCount: row.inviteCount,
    inviteWindowStart: row.inviteWindowStart ? toUTCDate(row.inviteWindowStart) : null,
    createdAt: toUTCDate(row.createdAt),
    updatedAt: toUTCDate(row.updatedAt),
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('User').select().eq('id', id).maybeSingle()
  return data ? mapUser(data as SupabaseUserRow) : null
}

export async function updateUserSettings(
  id: string,
  data: { hourlyRate?: number; payPeriodStart?: number; emailSummary?: boolean; timezone?: string }
): Promise<User> {
  const supabase = createServiceClient()
  const { data: updated, error } = await supabase
    .from('User')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapUser(updated as SupabaseUserRow)
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('User').select().order('createdAt', { ascending: true })
  return (data ?? []).map((row) => mapUser(row as SupabaseUserRow))
}
