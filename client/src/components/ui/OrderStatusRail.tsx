import { clsx } from 'clsx'
import type { Order } from '@/types/api'

const STEPS: { key: keyof Order; label: string }[] = [
  { key: 'createdAtUtc', label: 'Rascunho' },
  { key: 'submittedAtUtc', label: 'Pendente' },
  { key: 'confirmedAtUtc', label: 'Confirmado' },
  { key: 'processingAtUtc', label: 'Em processamento' },
  { key: 'completedAtUtc', label: 'Concluído' },
]

/**
 * Reconstructs progress purely from the order's own *AtUtc timestamps —
 * no separate status-to-step mapping to keep in sync with the backend's
 * state machine.
 */
export function OrderStatusRail({ order }: { order: Order }) {
  const reachedCount = STEPS.filter((s) => Boolean(order[s.key])).length
  const isCancelled = order.status === 'Cancelled'

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i < reachedCount
        const isCurrent = i === reachedCount - 1 && !isCancelled
        const isLast = i === STEPS.length - 1
        return (
          <div key={step.key} className={clsx('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                  done && !isCurrent && 'border-success bg-success text-white',
                  isCurrent && 'border-accent bg-accent text-white',
                  !done && 'border-border-strong bg-surface text-text-muted',
                )}
              >
                {done && !isCurrent ? '✓' : i + 1}
              </div>
              <span
                className={clsx(
                  'whitespace-nowrap text-[11px]',
                  done ? 'font-medium text-text-secondary' : 'text-text-muted',
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div className={clsx('mx-1.5 h-px flex-1 self-start mt-3', done ? 'bg-success' : 'bg-border-strong')} />
            ) : null}
          </div>
        )
      })}
      {isCancelled ? (
        <div className="ml-3 flex flex-col items-center gap-1.5">
          <div className="flex size-6 items-center justify-center rounded-full border border-danger bg-danger text-[11px] font-semibold text-white">
            ✕
          </div>
          <span className="whitespace-nowrap text-[11px] font-medium text-danger-subtle-text">Cancelado</span>
        </div>
      ) : null}
    </div>
  )
}
