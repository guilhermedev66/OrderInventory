import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export function LoadingRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="divide-y divide-border" role="status" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((__, c) => (
            <div
              key={c}
              className="h-3.5 flex-1 animate-pulse rounded-xs bg-surface-inset"
              style={{ maxWidth: c === 0 ? '40%' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description ? <p className="max-w-sm text-[13px] text-text-tertiary">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center" role="alert">
      <p className="text-sm font-medium text-danger-subtle-text">{message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}
