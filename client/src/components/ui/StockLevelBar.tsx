import { clsx } from 'clsx'

interface StockLevelBarProps {
  onHandStock: number
  reservedStock: number
  minimumStock: number
  size?: 'sm' | 'md'
}

/**
 * The bar's total width IS onHandStock (the physical count) — reserved and
 * available are drawn as segments that partition it, so available always
 * reads as "what's left of on-hand", never as an independent balance.
 */
export function StockLevelBar({ onHandStock, reservedStock, minimumStock, size = 'md' }: StockLevelBarProps) {
  const available = Math.max(onHandStock - reservedStock, 0)
  const reservedPct = onHandStock > 0 ? (reservedStock / onHandStock) * 100 : 0
  const availablePct = onHandStock > 0 ? (available / onHandStock) * 100 : 0
  const minimumPct = onHandStock > 0 ? Math.min((minimumStock / onHandStock) * 100, 100) : 0
  const belowMinimum = available < minimumStock

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className="flex min-w-[160px] flex-col gap-1.5">
      <div className={clsx('relative w-full overflow-hidden rounded-xs bg-surface-inset', barHeight)}>
        {onHandStock > 0 ? (
          <>
            <div
              className={clsx('absolute inset-y-0 left-0', belowMinimum ? 'bg-accent' : 'bg-success')}
              style={{ width: `${availablePct}%` }}
            />
            <div
              className="absolute inset-y-0 bg-text-muted/50"
              style={{ left: `${availablePct}%`, width: `${reservedPct}%` }}
            />
          </>
        ) : null}
        {minimumStock > 0 ? (
          <div
            className="absolute inset-y-0 w-px bg-text-secondary/70"
            style={{ left: `${minimumPct}%` }}
            title={`Estoque mínimo: ${minimumStock}`}
          />
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-[11px] tabular-nums text-text-tertiary">
        <span className="flex items-center gap-1">
          <span className={clsx('size-1.5 rounded-full', belowMinimum ? 'bg-accent' : 'bg-success')} />
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
