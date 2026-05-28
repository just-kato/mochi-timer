'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DarkModeToggle } from './DarkModeToggle'

const navItems = [
  { href: '/timer', label: 'TIMER' },
  { href: '/calendar', label: 'CALENDAR' },
  { href: '/stats', label: 'STATS' },
  { href: '/export', label: 'EXPORT' },
  { href: '/profile', label: 'PROFILE' },
]

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="w-full bg-black">
      <div className="max-w-2xl mx-auto px-2 flex items-center justify-between h-14">
        <div className="flex items-center overflow-x-auto">
          <div className="shrink-0 mr-1 border-r-[3px] border-white/20 pr-2">
            <Image
              src="/mr.mochi logo white.png"
              alt="Mochi Timer"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 text-xs font-bold tracking-widest whitespace-nowrap min-h-11 flex items-center ${
                pathname === href
                  ? 'bg-brutalist-yellow text-black'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center shrink-0">
          <DarkModeToggle />
          <button
            onClick={handleSignOut}
            className="text-xs font-bold tracking-widest text-white px-3 min-h-11 hover:text-brutalist-yellow whitespace-nowrap"
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </nav>
  )
}
