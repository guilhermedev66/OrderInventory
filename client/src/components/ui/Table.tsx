import type { ReactNode, ThHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function TableScroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('overflow-x-auto', className)}>{children}</div>
}

export function Table({ minWidth, className, children }: { minWidth: number; className?: string; children: ReactNode }) {
  return (
    <table className={clsx('w-full text-left text-[13px]', className)} style={{ minWidth }}>
      {children}
    </table>
  )
}

/** Sticky within the scrollable page — stays visible while long tables scroll under it. */
export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-surface">
      <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-tertiary">{children}</tr>
    </thead>
  )
}

export function Th({ align, className, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'right' }) {
  return <th className={clsx('px-4 py-2.5 font-medium', align === 'right' && 'text-right', className)} {...props} />
}
