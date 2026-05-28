interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-[3px] border-black border-dashed">
      <p className="text-xl font-bold uppercase tracking-widest">{title}</p>
      {description && (
        <p className="text-xs font-bold uppercase tracking-wide mt-3 text-zinc-500">{description}</p>
      )}
    </div>
  )
}
