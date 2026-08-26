import { clsx } from 'clsx'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <rect x="3.5" y="16.5" width="5.5" height="10.5" rx="1.6" fill="currentColor" className="text-text-muted" opacity=".45" />
        <rect x="13.25" y="10" width="5.5" height="17" rx="1.6" fill="#3b82f6" />
        <rect x="23" y="3.5" width="5.5" height="23.5" rx="1.6" fill="#8b5cf6" />
        <line x1="2" y1="29" x2="30" y2="29" stroke="currentColor" className="text-text-muted" strokeWidth="1.4" strokeLinecap="round" opacity=".4" />
      </svg>
      {compact ? null : <span className="text-[15px] font-semibold tracking-[-0.02em] text-text-primary">OrderInventory</span>}
    </div>
  )
}
