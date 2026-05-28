interface StatsCardProps {
  label: string
  value: string
  sub?: string
}

export function StatsCard({ label, value, sub }: StatsCardProps) {
  return (
    <div className="border-[3px] border-black p-4 shadow-brutal bg-white">
      <p className="text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-mono-brutal font-bold tabular-nums">{value}</p>
      {sub && (
        <p className="text-xs font-bold uppercase tracking-wide mt-2 text-zinc-500">{sub}</p>
      )}
    </div>
  )
}
