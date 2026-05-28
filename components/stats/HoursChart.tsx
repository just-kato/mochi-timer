'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { colors } from '@/lib/design/tokens'

interface DailyBar {
  date: string
  hours: number
}

interface HoursChartProps {
  data: DailyBar[]
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export function HoursChart({ data }: HoursChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center border-[3px] border-black border-dashed">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          NO DATA FOR THIS PERIOD
        </span>
      </div>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="h-56 border-[3px] border-black p-4 bg-white" data-testid="hours-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 10, fill: colors.black, fontWeight: 700, fontFamily: 'var(--font-space-grotesk)' }}
            axisLine={{ stroke: colors.black, strokeWidth: 2 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: colors.black, fontWeight: 700, fontFamily: 'var(--font-space-grotesk)' }}
            axisLine={{ stroke: colors.black, strokeWidth: 2 }}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}h`, 'HOURS']}
            labelFormatter={(label) => shortDate(String(label))}
            contentStyle={{
              border: '3px solid #000000',
              borderRadius: 0,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-space-grotesk)',
              background: '#FFFFFF',
            }}
          />
          <Bar dataKey="hours" radius={[0, 0, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.date === todayStr ? colors.yellow : colors.black}
                stroke={colors.black}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
