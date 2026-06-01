import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/shared/NavBar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure a User row exists. Must include all non-nullable columns because
  // updatedAt has no DB-level default (Prisma manages it client-side).
  const serviceClient = createServiceClient()
  const now = new Date().toISOString()
  await serviceClient.from('User').upsert({
    id: user.id,
    email: user.email!,
    role: (user.user_metadata?.role as string) ?? 'user',
    hourlyRate: 0,
    payPeriodStart: 1,
    emailSummary: true,
    timezone: 'America/New_York',
    inviteCount: 0,
    createdAt: now,
    updatedAt: now,
  }, { onConflict: 'id', ignoreDuplicates: true })

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 dark:bg-zinc-950">{children}</main>
    </div>
  )
}
