'use client'

export function TimerCrashFallback() {
  return (
    <div className="border-[3px] border-black bg-brutalist-red p-8 text-center">
      <p className="font-bold uppercase tracking-widest text-black mb-2">
        SOMETHING WENT WRONG WITH THE TIMER
      </p>
      <p className="text-xs font-bold uppercase tracking-widest text-black mb-6">
        YOUR TIMER IS STILL RUNNING. REFRESH TO RECOVER.
      </p>
      <button
        onClick={() => location.reload()}
        className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest border-[3px] border-black btn-brutal shadow-brutal-sm"
      >
        REFRESH
      </button>
    </div>
  )
}
