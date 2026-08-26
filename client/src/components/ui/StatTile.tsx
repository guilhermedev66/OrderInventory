import type { ReactNode } from 'react'
import { clsx } from 'clsx'

const iconToneClasses: Record<'neutral' | 'danger' | 'warning', string> = {
  neutral: 'bg-surface-inset text-text-muted',
  danger: 'bg-danger-subtle text-danger',
  warning: 'bg-warning-subtle text-warning',
}

/** Its own bordered card, not a divider-separated slot in a shared panel —
 * each indicator reads as a standalone unit, with room to breathe. */
export function StatTile({
  label,
  value,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: ReactNode
  tone?: 'neutral' | 'danger' | 'warning'
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-1 items-center gap-3.5 rounded-md border border-border bg-surface px-5 py-4 shadow-card">
      {icon ? (
        <span className={clsx('flex size-9 shrink-0 items-center justify-center rounded-sm', iconToneClasses[tone])}>{icon}</span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
        <p
          className={clsx(
            'mt-0.5 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
            tone === 'danger' && 'text-danger',
            tone === 'warning' && 'text-warning',
            tone === 'neutral' && 'text-text-primary',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
