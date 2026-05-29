import { type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function getServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: (() => {}) as never },
  })
}

export async function signInAsUser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Password' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/timer')
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL('/login')
}

export async function createTestUser(
  email: string,
  password: string,
  role: 'admin' | 'user' = 'user'
): Promise<string> {
  const supabase = getServiceClient()

  // Clean up any stale Prisma User rows for this email (leftover from aborted runs)
  await supabase.from('Session').delete().in(
    'userId',
    (await supabase.from('User').select('id').eq('email', email)).data?.map((r: { id: string }) => r.id) ?? []
  )
  await supabase.from('User').delete().eq('email', email)

  // If the auth user already exists, delete and recreate to get a clean state
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === email)
  if (found) {
    await supabase.auth.admin.deleteUser(found.id)
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  })
  if (error) throw new Error(`createTestUser failed: ${error.message}`)

  // Create the Prisma User row so FK constraints work without needing a browser login
  const now = new Date().toISOString()
  const { error: rowError } = await supabase.from('User').insert({
    id: data.user.id,
    email,
    role,
    hourlyRate: 50,
    payPeriodStart: 1,
    emailSummary: false,
    timezone: 'America/New_York',
    inviteCount: 0,
    createdAt: now,
    updatedAt: now,
  })
  if (rowError) throw new Error(`createTestUser row failed: ${rowError.message}`)

  return data.user.id
}

export async function deleteTestUser(id: string): Promise<void> {
  if (!id) return
  const supabase = getServiceClient()
  // Delete sessions first (FK), then user row, then auth user
  await supabase.from('Session').delete().eq('userId', id)
  await supabase.from('User').delete().eq('id', id)
  await supabase.auth.admin.deleteUser(id)
}

export async function createTestSession(
  userId: string,
  startTime: Date,
  endTime: Date,
  notes?: string
): Promise<string> {
  const id = crypto.randomUUID()
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  const supabase = getServiceClient()
  const { error } = await supabase.from('Session').insert({
    id,
    userId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration,
    notes: notes ?? null,
    synced: true,
  })
  if (error) throw new Error(`createTestSession failed: ${error.message}`)
  return id
}

export async function deleteTestSessions(userId: string): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from('Session').delete().eq('userId', userId)
}
