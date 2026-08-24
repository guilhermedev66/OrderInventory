import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-md border border-border bg-surface shadow-[0_14px_40px_rgba(0,0,0,0.12)]', className)}
      {...props}
    />
  )
}
