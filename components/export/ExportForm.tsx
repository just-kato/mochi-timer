'use client'

import { useState } from 'react'
import { formatDateForInput } from '@/lib/utils/format'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

type InvoiceType = 'summary' | 'detailed'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black px-4 py-2 mb-0">
      <p className="text-xs font-bold uppercase tracking-widest text-white">{children}</p>
    </div>
  )
}

export function ExportForm() {
  const today = formatDateForInput(new Date())
  const monthAgo = formatDateForInput(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

  const [start, setStart] = useState(monthAgo)
  const [end, setEnd] = useState(today)
  const [clientName, setClientName] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${today.replace(/-/g, '')}`)
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('summary')
  const [loading, setLoading] = useState<'pdf' | 'csv' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExport(format: 'pdf' | 'csv') {
    setLoading(format)
    setError(null)
    try {
      const params = new URLSearchParams({ format, start, end })
      if (format === 'pdf') {
        if (invoiceNumber) params.set('invoiceNumber', invoiceNumber)
        if (clientName) params.set('clientName', clientName)
        if (clientCompany) params.set('clientCompany', clientCompany)
        if (clientAddress) params.set('clientAddress', clientAddress)
        params.set('invoiceType', invoiceType)
      }
      const res = await fetch(`/api/export?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'pdf'
        ? `invoice-${start}-${end}.pdf`
        : `mochi-time-${start}-${end}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-lg space-y-0 border-[3px] border-black shadow-brutal">

      {/* ── DATE RANGE ─────────────────────────────────────── */}
      <SectionLabel>Date Range</SectionLabel>
      <div className="border-b-[3px] border-black grid grid-cols-2">
        <div className="p-4 border-r-[3px] border-black">
          <label htmlFor="start" className="block text-xs font-bold uppercase tracking-widest mb-2">
            Start
          </label>
          <input
            id="start"
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="w-full border-[3px] border-black px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow font-mono-brutal"
          />
        </div>
        <div className="p-4">
          <label htmlFor="end" className="block text-xs font-bold uppercase tracking-widest mb-2">
            End
          </label>
          <input
            id="end"
            type="date"
            value={end}
            min={start}
            max={today}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full border-[3px] border-black px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow font-mono-brutal"
          />
        </div>
      </div>

      {/* ── INVOICE DETAILS ────────────────────────────────── */}
      <SectionLabel>Invoice Details</SectionLabel>
      <div className="border-b-[3px] border-black">
        <div className="p-4 border-b-[3px] border-black">
          <label htmlFor="invoiceNumber" className="block text-xs font-bold uppercase tracking-widest mb-2">
            Invoice #
          </label>
          <div className="flex">
            <input
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-20260528"
              className="flex-1 min-w-0 border-[3px] border-r-0 border-black px-3 py-2 text-xs focus:outline-none focus:bg-brutalist-yellow font-mono-brutal"
            />
            <button
              type="button"
              onClick={() => setInvoiceNumber(crypto.randomUUID())}
              className="shrink-0 border-[3px] border-black bg-black text-brutalist-yellow px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 whitespace-nowrap"
            >
              ↺ UUID
            </button>
          </div>
        </div>
        <div className="p-4 border-b-[3px] border-black">
          <label htmlFor="clientName" className="block text-xs font-bold uppercase tracking-widest mb-2">
            Client Name
          </label>
          <input
            id="clientName"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full border-[3px] border-black px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow"
          />
        </div>
        <div className="p-4 border-b-[3px] border-black">
          <label htmlFor="clientCompany" className="block text-xs font-bold uppercase tracking-widest mb-2">
            Company
          </label>
          <input
            id="clientCompany"
            type="text"
            value={clientCompany}
            onChange={(e) => setClientCompany(e.target.value)}
            placeholder="Acme Corp"
            className="w-full border-[3px] border-black px-3 py-2 text-sm focus:outline-none focus:bg-brutalist-yellow"
          />
        </div>
        <div className="p-4">
          <label htmlFor="clientAddress" className="block text-xs font-bold uppercase tracking-widest mb-2">
            Address
          </label>
          <textarea
            id="clientAddress"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            rows={2}
            placeholder={"123 Main St\nNew York, NY 10001"}
            className="w-full border-[3px] border-black px-3 py-2 text-sm resize-none focus:outline-none focus:bg-brutalist-yellow"
          />
        </div>
      </div>

      {/* ── INVOICE TYPE ───────────────────────────────────── */}
      <SectionLabel>Invoice Type</SectionLabel>
      <div className="grid grid-cols-2 border-b-[3px] border-black">
        <button
          type="button"
          onClick={() => setInvoiceType('summary')}
          className={`p-4 text-left border-r-[3px] border-black transition-none ${
            invoiceType === 'summary' ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 ${
              invoiceType === 'summary' ? 'border-white bg-white' : 'border-black'
            }`}>
              {invoiceType === 'summary' && <span className="w-2 h-2 bg-black block" />}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">Hours Summary</span>
          </div>
          <p className={`text-xs leading-relaxed ${invoiceType === 'summary' ? 'text-zinc-300' : 'text-zinc-500'}`}>
            Total hours per day. Clean invoice format.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setInvoiceType('detailed')}
          className={`p-4 text-left transition-none ${
            invoiceType === 'detailed' ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 ${
              invoiceType === 'detailed' ? 'border-white bg-white' : 'border-black'
            }`}>
              {invoiceType === 'detailed' && <span className="w-2 h-2 bg-black block" />}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">Detailed Log</span>
          </div>
          <p className={`text-xs leading-relaxed ${invoiceType === 'detailed' ? 'text-zinc-300' : 'text-zinc-500'}`}>
            Every session with in/out times listed.
          </p>
        </button>
      </div>

      {/* ── ERROR ──────────────────────────────────────────── */}
      {error && (
        <div className="border-b-[3px] border-black bg-brutalist-red px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-black">{error}</p>
        </div>
      )}

      {/* ── ACTIONS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2">
        <button
          onClick={() => handleExport('pdf')}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 bg-brutalist-yellow border-r-[3px] border-black py-4 text-xs font-bold uppercase tracking-widest btn-brutal disabled:opacity-50"
        >
          {loading === 'pdf' ? <LoadingSpinner size="sm" /> : null}
          Invoice PDF
        </button>
        <button
          onClick={() => handleExport('csv')}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 bg-white py-4 text-xs font-bold uppercase tracking-widest btn-brutal disabled:opacity-50"
        >
          {loading === 'csv' ? <LoadingSpinner size="sm" /> : null}
          Export CSV
        </button>
      </div>

    </div>
  )
}
