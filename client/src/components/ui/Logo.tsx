import { clsx } from 'clsx'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={clsx('flex items-center gap-2.5 text-accent', className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <path d="M16 3 27 9.2v13.6L16 29 5 22.8V9.2L16 3Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="m5.8 9.7 10.2 6 10.2-6M16 15.7V28" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="m10.5 6.2 10.4 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      </svg>
      {compact ? null : <span className="text-[15px] font-semibold tracking-[-0.02em] text-text-primary">OrderInventory</span>}
    </div>
  )
}
