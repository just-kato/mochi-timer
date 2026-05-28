'use client'

interface TimerButtonProps {
  running: boolean
  loading: boolean
  onStart: () => void
  onStop: () => void
}

export function TimerButton({ running, loading, onStart, onStop }: TimerButtonProps) {
  return (
    <button
      onClick={running ? onStop : onStart}
      disabled={loading}
      className={`w-44 h-44 text-2xl font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal ${
        running
          ? 'bg-brutalist-yellow text-black'
          : 'bg-white text-black'
      }`}
      aria-label={running ? 'Stop timer' : 'Start timer'}
    >
      {loading ? '▋' : running ? 'STOP' : 'START'}
    </button>
  )
}
