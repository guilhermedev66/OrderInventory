import { clsx } from 'clsx'

/** Stacked-pallet mark — three offset blocks, a nod to warehouse stacking. */
export function Logo({ className, mono }: { className?: string; mono?: boolean }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="1" y="13" width="20" height="4" rx="1" fill={mono ? 'currentColor' : 'var(--color-accent)'} opacity="0.9" />
        <rect x="3" y="7.5" width="16" height="4" rx="1" fill={mono ? 'currentColor' : 'var(--color-accent)'} opacity="0.65" />
        <rect x="5" y="2" width="12" height="4" rx="1" fill={mono ? 'currentColor' : 'var(--color-accent)'} opacity="0.4" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight">OrderInventory</span>
    </div>
  )
}
