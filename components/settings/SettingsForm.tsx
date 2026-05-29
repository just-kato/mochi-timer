'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TIMEZONES } from '@/lib/constants/timezones'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const TIMEZONE_REGIONS = ['Americas', 'Europe & Africa', 'Asia & Pacific']

interface SettingsFormProps {
  initialHourlyRate: number
  initialPayPeriodStart: number
  initialEmailSummary: boolean
  initialTimezone: string
}

export function SettingsForm({
  initialHourlyRate,
  initialPayPeriodStart,
  initialEmailSummary,
  initialTimezone,
}: SettingsFormProps) {
  const [hourlyRate, setHourlyRate] = useState(String(initialHourlyRate))
  const [payPeriodStart, setPayPeriodStart] = useState(initialPayPeriodStart)
  const [emailSummary, setEmailSummary] = useState(initialEmailSummary)
  const [timezone, setTimezone] = useState(initialTimezone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleDarkMode() {
    const next = !darkMode
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('mochi-theme', next ? 'dark' : 'light') } catch {}
    setDarkMode(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const rate = parseFloat(hourlyRate)
    if (isNaN(rate) || rate < 0) {
      setError('Hourly rate must be a positive number')
      setLoading(false)
      return
    }

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hourlyRate: rate, payPeriodStart, emailSummary, timezone }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      setError(data.error ?? 'Failed to save settings')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm">
      <div className="mb-6">
        <label htmlFor="hourlyRate" className="block text-xs font-bold uppercase tracking-widest mb-2">
          HOURLY RATE (USD)
        </label>
        <div className="flex items-stretch border-[3px] border-black focus-within:bg-brutalist-yellow">
          <span className="px-3 flex items-center text-sm font-bold border-r-[3px] border-black bg-black text-white">
            $
          </span>
          <input
            id="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="flex-1 px-3 py-3 text-sm font-mono-brutal font-bold focus:outline-none bg-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="payPeriodStart" className="block text-xs font-bold uppercase tracking-widest mb-2">
          PAY PERIOD STARTS ON
        </label>
        <select
          id="payPeriodStart"
          value={payPeriodStart}
          onChange={(e) => setPayPeriodStart(parseInt(e.target.value))}
          className="w-full border-[3px] border-black px-3 py-3 text-sm font-bold focus:outline-none focus:bg-brutalist-yellow bg-white"
        >
          {DAY_NAMES.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="timezone" className="block text-xs font-bold uppercase tracking-widest mb-2">
          CLOCK TIMEZONE
        </label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full border-[3px] border-black px-3 py-3 text-sm font-bold focus:outline-none focus:bg-brutalist-yellow bg-white"
        >
          {TIMEZONE_REGIONS.map((region) => (
            <optgroup key={region} label={region}>
              {TIMEZONES.filter((tz) => tz.region === region).map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-widest">
          DARK MODE
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={darkMode}
          onClick={toggleDarkMode}
          className={`w-16 min-h-11 border-[3px] border-black text-xs font-bold uppercase tracking-widest transition-colors ${
            darkMode ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          {darkMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <label htmlFor="emailSummary" className="text-xs font-bold uppercase tracking-widest">
          WEEKLY SUMMARY EMAIL
        </label>
        <button
          type="button"
          id="emailSummary"
          role="switch"
          aria-checked={emailSummary}
          onClick={() => setEmailSummary((v) => !v)}
          className={`w-16 min-h-11 border-[3px] border-black text-xs font-bold uppercase tracking-widest transition-colors ${
            emailSummary ? 'bg-black text-white' : 'bg-white text-black'
          }`}
        >
          {emailSummary ? 'ON' : 'OFF'}
        </button>
      </div>

      {error && (
        <div className="mb-5 border-[3px] border-black bg-brutalist-red px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
        </div>
      )}
      {saved && (
        <div className="mb-5 border-[3px] border-black bg-brutalist-green px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-black">SETTINGS SAVED</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-3 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal-sm"
      >
        {loading && <LoadingSpinner size="sm" />}
        SAVE SETTINGS
      </button>
    </form>
  )
}
