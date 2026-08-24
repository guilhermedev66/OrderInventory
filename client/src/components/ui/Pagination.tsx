import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)
  if (totalCount === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-[12px] tabular-nums text-text-tertiary">
        {start}–{end} de {totalCount}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-14 text-center text-[12px] tabular-nums text-text-secondary">
          {page} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
