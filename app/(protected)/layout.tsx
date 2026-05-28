import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
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

  // Ensure a User row exists for password-login users who bypass /auth/callback.
  // Ignore conflicts — row already exists is fine.
  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
        role: (user.user_metadata?.role as string) ?? 'user',
      },
    })
  } catch {
    // P2002 unique constraint on email means row already exists — no-op
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 dark:bg-zinc-950">{children}</main>
    </div>
  )
}
