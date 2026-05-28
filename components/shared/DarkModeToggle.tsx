'use client'

import { useState, useEffect } from 'react'

export function DarkModeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('mochi-theme', next ? 'dark' : 'light') } catch {}
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-xs font-bold tracking-widest text-white px-3 min-h-11 hover:text-brutalist-yellow whitespace-nowrap shrink-0"
    >
      {dark ? 'LIGHT' : 'DARK'}
    </button>
  )
}
