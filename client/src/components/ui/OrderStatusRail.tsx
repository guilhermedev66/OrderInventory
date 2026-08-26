import { clsx } from 'clsx'
import { Check, X } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import type { Order } from '@/types/api'

const STEPS: { key: keyof Order; label: string }[] = [
  { key: 'createdAtUtc', label: 'Rascunho' },
  { key: 'submittedAtUtc', label: 'Pendente' },
  { key: 'confirmedAtUtc', label: 'Confirmado' },
  { key: 'processingAtUtc', label: 'Em processamento' },
  { key: 'completedAtUtc', label: 'Concluído' },
]

/**
 * A manifest strip, not a generic circle-stepper: each stage is a stamped
 * rectangular ticket (same grammar as Badge — sharp radius, mono uppercase
 * label) carrying its own timestamp, joined by a rail. Reconstructs progress
 * purely from the order's own *AtUtc timestamps — no separate status-to-step
 * mapping to keep in sync with the backend's state machine.
 */
export function OrderStatusRail({ order }: { order: Order }) {
  const reachedCount = STEPS.filter((s) => Boolean(order[s.key])).length
  const isCancelled = order.status === 'Cancelled'

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-stretch">
        {STEPS.map((step, i) => {
          const done = i < reachedCount
          const isCurrent = i === reachedCount - 1 && !isCancelled
          const isLast = i === STEPS.length - 1 && !isCancelled
          const timestamp = order[step.key] as string | null

          return (
            <div key={step.key} className={clsx('flex items-stretch', !isLast && 'flex-1')}>
              <div
                className={clsx(
                  'flex min-w-[128px] flex-col gap-1 rounded-[3px] border px-3 py-2',
                  isCurrent && 'border-accent bg-accent text-white shadow-sm',
                  done && !isCurrent && 'border-success/40 bg-success-subtle text-success-subtle-text',
                  !done && 'border-dashed border-border-strong bg-surface text-text-muted',
                )}
              >
                <span className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em]">
                  {done && !isCurrent ? <Check className="size-3" aria-hidden="true" /> : null}
                  {step.label}
                </span>
                <span className={clsx('text-[11px] tabular-nums', isCurrent ? 'text-white/85' : done ? 'text-success-subtle-text/80' : 'text-text-muted')}>
                  {timestamp ? formatDateTime(timestamp) : '—'}
                </span>
              </div>
              {!isLast ? (
                <div className={clsx('mt-[19px] h-px flex-1 self-start', done ? 'bg-success/50' : 'bg-border-strong')} />
              ) : null}
            </div>
          )
        })}

        {isCancelled ? (
          <>
            <div className="mt-[19px] h-px w-6 self-start bg-danger/50" />
            <div className="flex min-w-[128px] flex-col gap-1 rounded-[3px] border border-danger/40 bg-danger-subtle px-3 py-2 text-danger-subtle-text">
              <span className="flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em]">
                <X className="size-3" aria-hidden="true" />
                Cancelado
              </span>
              <span className="text-[11px] tabular-nums text-danger-subtle-text/80">
                {order.cancelledAtUtc ? formatDateTime(order.cancelledAtUtc) : '—'}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
