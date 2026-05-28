interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="border-[3px] border-black bg-brutalist-red px-4 py-3 flex items-center gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-black flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-bold uppercase tracking-widest underline text-black min-h-0 min-w-0 shrink-0"
        >
          RETRY
        </button>
      )}
    </div>
  )
}
