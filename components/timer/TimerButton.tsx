'use client'

interface TimerButtonProps {
  running: boolean
  paused: boolean
  loading: boolean
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
}

export function TimerButton({ running, paused, loading, onStart, onStop, onPause, onResume }: TimerButtonProps) {
  if (!running) {
    return (
      <button
        onClick={onStart}
        disabled={loading}
        className="w-44 h-44 text-2xl font-bold uppercase tracking-widest border-[3px] border-black bg-white text-black btn-brutal shadow-brutal"
        aria-label="Start timer"
      >
        {loading ? '▋' : 'START'}
      </button>
    )
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={paused ? onResume : onPause}
        disabled={loading}
        className={`w-32 h-32 text-sm font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal ${
          paused ? 'bg-brutalist-yellow text-black' : 'bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-600'
        }`}
        aria-label={paused ? 'Resume timer' : 'Pause timer'}
      >
        {paused ? 'RESUME' : 'PAUSE'}
      </button>
      <button
        onClick={onStop}
        disabled={loading}
        className="w-32 h-32 text-sm font-bold uppercase tracking-widest border-[3px] border-black bg-brutalist-yellow text-black btn-brutal shadow-brutal"
        aria-label="Stop timer"
      >
        {loading ? '▋' : 'STOP'}
      </button>
    </div>
  )
}
