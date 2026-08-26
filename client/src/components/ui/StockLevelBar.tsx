import { clsx } from 'clsx'
import { Badge } from '@/components/ui/Badge'

interface StockLevelBarProps {
  onHandStock: number
  reservedStock: number
  minimumStock: number
  size?: 'sm' | 'md'
  showStatus?: boolean
}

export type StockState = 'normal' | 'low' | 'out'

export function stockState(availableStock: number, minimumStock: number): StockState {
  if (availableStock <= 0) return 'out'
  if (availableStock < minimumStock) return 'low'
  return 'normal'
}

const STATE_LABEL: Record<StockState, string> = { normal: 'Normal', low: 'Baixo', out: 'Sem estoque' }
const STATE_TONE: Record<StockState, 'success' | 'warning' | 'danger'> = { normal: 'success', low: 'warning', out: 'danger' }
const STATE_FILL: Record<StockState, string> = { normal: 'bg-success', low: 'bg-warning', out: 'bg-danger' }

/**
 * The bar's total width IS onHandStock (the physical count) — reserved and
 * available are drawn as segments that partition it, so available always
 * reads as "what's left of on-hand", never as an independent balance.
 *
 * Zero on-hand renders a distinct hatched track (not just an empty bar) so
 * "sem estoque" reads as a state, not a loading glitch — state is carried
 * by the status word + hatch pattern, not color alone.
 */
export function StockLevelBar({ onHandStock, reservedStock, minimumStock, size = 'md', showStatus = true }: StockLevelBarProps) {
  const available = Math.max(onHandStock - reservedStock, 0)
  const reservedPct = onHandStock > 0 ? (reservedStock / onHandStock) * 100 : 0
  const availablePct = onHandStock > 0 ? (available / onHandStock) * 100 : 0
  const minimumPct = onHandStock > 0 ? Math.min((minimumStock / onHandStock) * 100, 100) : 0
  const state = stockState(available, minimumStock)

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className="flex min-w-[180px] flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className={clsx('relative min-w-0 flex-1 overflow-hidden rounded-xs bg-surface-inset', barHeight)}>
          {onHandStock > 0 ? (
            <>
              <div className={clsx('absolute inset-y-0 left-0', STATE_FILL[state])} style={{ width: `${availablePct}%` }} />
              <div className="absolute inset-y-0 bg-text-muted/50" style={{ left: `${availablePct}%`, width: `${reservedPct}%` }} />
            </>
          ) : (
            <div
              className="absolute inset-0 opacity-60"
              style={{ backgroundImage: 'repeating-linear-gradient(135deg, var(--color-danger) 0 3px, transparent 3px 7px)' }}
              aria-hidden="true"
            />
          )}
          {minimumStock > 0 && onHandStock > 0 ? (
            <div
              className="absolute inset-y-0 w-px bg-text-secondary/70"
              style={{ left: `${minimumPct}%` }}
              title={`Estoque mínimo: ${minimumStock}`}
            />
          ) : null}
        </div>
        {showStatus ? <Badge tone={STATE_TONE[state]}>{STATE_LABEL[state]}</Badge> : null}
      </div>
      <div className="flex items-center gap-3 text-[11px] tabular-nums text-text-tertiary">
        <span className="flex items-center gap-1">
          <span className={clsx('size-1.5 rounded-full', STATE_FILL[state])} />
          Disp. {available}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-text-muted/50" />
          Reserv. {reservedStock}
        </span>
        <span className="text-text-muted">Físico {onHandStock}</span>
      </div>
    </div>
  )
}
