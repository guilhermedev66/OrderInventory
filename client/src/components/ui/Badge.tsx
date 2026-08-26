import type { ReactNode } from 'react'
import { clsx } from 'clsx'

type Tone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'

const toneClasses: Record<Tone, string> = {
  neutral: 'border-border-strong bg-surface-inset text-text-secondary',
  success: 'border-success/40 bg-success-subtle text-success-subtle-text',
  danger: 'border-danger/40 bg-danger-subtle text-danger-subtle-text',
  warning: 'border-warning/40 bg-warning-subtle text-warning-subtle-text',
  info: 'border-info/40 bg-info-subtle text-info-subtle-text',
}

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-text-muted',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
}

/**
 * Ledger-stamp style: rectangular (not a pill), mono uppercase, a leading
 * signal dot. Reads as a manifest entry, not a generic status pill.
 */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.05em]',
        toneClasses[tone],
      )}
    >
      <span className={clsx('size-1.5 shrink-0 rounded-full', dotClasses[tone])} />
      {children}
    </span>
  )
}
