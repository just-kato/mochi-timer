'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIOD_OPTIONS = [
  { label: 'THIS WEEK', value: 'week' },
  { label: 'PAY PERIOD', value: 'pay-period' },
]

export function PayPeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') ?? 'week'

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    router.push(`/stats?${params.toString()}`)
  }

  return (
    <div className="flex border-[3px] border-black overflow-hidden">
      {PERIOD_OPTIONS.map(({ label, value }, i) => (
        <button
          key={value}
          onClick={() => select(value)}
          className={`px-4 text-xs font-bold tracking-widest min-h-11 ${
            i > 0 ? 'border-l-[3px] border-black' : ''
          } ${
            current === value
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-brutalist-yellow'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
