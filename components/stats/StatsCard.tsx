interface StatsCardProps {
  label: string
  value: string
  sub?: string
}

export function StatsCard({ label, value, sub }: StatsCardProps) {
  return (
    <div className="border-[3px] border-black dark:border-zinc-700 p-4 shadow-brutal bg-white dark:bg-zinc-900">
      <p className="text-xs font-bold uppercase tracking-widest mb-2 text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-3xl font-mono-brutal font-bold tabular-nums text-black dark:text-zinc-100">{value}</p>
      {sub && (
        <p className="text-xs font-bold uppercase tracking-wide mt-2 text-zinc-500 dark:text-zinc-400">{sub}</p>
      )}
    </div>
  )
}
