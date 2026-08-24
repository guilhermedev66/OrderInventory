import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-inset text-text-secondary',
  success: 'bg-success-subtle text-success-subtle-text',
  danger: 'bg-danger-subtle text-danger-subtle-text',
  warning: 'bg-warning-subtle text-warning-subtle-text',
  info: 'bg-info-subtle text-info-subtle-text',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-xs border border-current/10 px-2 py-0.5 text-[11px] font-semibold leading-4',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}
