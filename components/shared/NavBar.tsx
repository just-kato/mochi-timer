'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const currentLabel = navItems.find((n) => n.href === pathname)?.label ?? 'MENU'

  return (
    <nav className="w-full bg-black relative z-40">
      <div className="max-w-2xl mx-auto px-2 flex items-center justify-between h-14">

        {/* Logo */}
        <div className="flex items-center shrink-0">
          <div className="shrink-0 border-r-[3px] border-white/20 pr-2 mr-2">
            <Image
              src="/mr.mochi logo white.png"
              alt="Mochi Timer"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>

          {/* Desktop: nav links inline */}
          <div className="hidden sm:flex items-center">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 text-xs font-bold tracking-widest whitespace-nowrap min-h-11 flex items-center ${
                  pathname === href ? 'bg-brutalist-yellow text-black' : 'text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile: current page label */}
          <span className="sm:hidden text-xs font-bold tracking-widest text-brutalist-yellow">
            {currentLabel}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center shrink-0">

          {/* Desktop: sign out */}
          <button
            onClick={handleSignOut}
            className="hidden sm:flex text-xs font-bold tracking-widest text-white px-3 min-h-11 items-center hover:text-brutalist-yellow whitespace-nowrap"
          >
            SIGN OUT
          </button>

          {/* Mobile: hamburger / close */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="sm:hidden text-white px-3 min-h-11 flex items-center"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden absolute top-14 left-0 right-0 bg-black border-t-[3px] border-white/20">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center px-4 text-xs font-bold tracking-widest border-b border-white/10 min-h-11 ${
                pathname === href ? 'bg-brutalist-yellow text-black' : 'text-white hover:bg-white/10'
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 text-xs font-bold tracking-widest text-white min-h-11 flex items-center hover:text-brutalist-yellow"
          >
            SIGN OUT
          </button>
        </div>
      )}
    </nav>
  )
}
