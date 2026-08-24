import type { ReactNode } from 'react'
import { clsx } from 'clsx'

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
    <div className="flex flex-1 items-center gap-3 border-r border-border px-5 py-4 last:border-r-0">
      {icon ? <span className="text-text-muted">{icon}</span> : null}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
        <p
          className={clsx(
            'mt-0.5 text-[22px] font-semibold leading-none tabular-nums',
            tone === 'danger' && 'text-danger',
            tone === 'warning' && 'text-accent',
            tone === 'neutral' && 'text-text-primary',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
