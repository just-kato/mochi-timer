export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-2 h-4', md: 'w-3 h-5', lg: 'w-4 h-7' }[size]
  return (
    <span
      className={`${sizeClass} bg-current animate-pulse inline-block`}
      role="status"
      aria-label="Loading"
    />
  )
}
