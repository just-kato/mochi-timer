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

  // Ensure a User row exists for password-login users who bypass /auth/callback.
  const serviceClient = createServiceClient()
  await serviceClient.from('User').upsert({
    id: user.id,
    email: user.email!,
    role: (user.user_metadata?.role as string) ?? 'user',
  }, { onConflict: 'id', ignoreDuplicates: true })

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 dark:bg-zinc-950">{children}</main>
    </div>
  )
}
