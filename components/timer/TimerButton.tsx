'use client'

interface TimerButtonProps {
  running: boolean
  paused: boolean
  loading: boolean
  canStop?: boolean
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
}

export function TimerButton({ running, paused, loading, canStop = true, onStart, onStop, onPause, onResume }: TimerButtonProps) {
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
        title={paused ? 'Resume timer' : 'Pause timer'}
        className={`w-32 h-32 text-sm font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal ${
          paused ? 'bg-brutalist-yellow text-black' : 'bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-600'
        }`}
        aria-label={paused ? 'Resume timer' : 'Pause timer'}
      >
        {paused ? 'RESUME' : 'PAUSE'}
      </button>
      <button
        onClick={onStop}
        disabled={loading || !canStop}
        className="w-32 h-32 text-sm font-bold uppercase tracking-widest border-[3px] border-black bg-brutalist-yellow text-black btn-brutal shadow-brutal disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Stop timer"
        title={!canStop ? 'Enter a Task ID to stop the timer' : 'Stop and save this session'}
      >
        {loading ? '▋' : 'STOP'}
      </button>
    </div>
  )
}
