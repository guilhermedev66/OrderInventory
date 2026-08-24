import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-inset text-text-secondary',
  success: 'bg-success-subtle text-success-subtle-text',
  danger: 'bg-danger-subtle text-danger-subtle-text',
  warning: 'bg-accent-subtle text-accent-subtle-text',
  info: 'bg-info-subtle text-info-subtle-text',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-xs px-1.5 py-0.5 text-[12px] font-medium leading-4',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  )
}
