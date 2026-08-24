import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-md border border-border bg-surface', className)}
      {...props}
    />
  )
}
