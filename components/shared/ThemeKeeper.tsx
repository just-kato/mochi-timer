'use client'

import { useEffect } from 'react'

// router.refresh() causes React to reconcile <html> from the server RSC payload,
// which has no `dark` class — stripping it from the DOM. This component watches
// for class changes on <html> via MutationObserver and immediately re-applies
// the correct theme from localStorage before the browser paints.
export function ThemeKeeper() {
  useEffect(() => {
    function applyTheme() {
      try {
        const t = localStorage.getItem('mochi-theme')
        const shouldBeDark =
          t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches)
        document.documentElement.classList.toggle('dark', shouldBeDark)
      } catch {}
    }

    applyTheme()

    const observer = new MutationObserver(applyTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return null
}
