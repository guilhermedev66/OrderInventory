import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-6 sm:px-7">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-text-primary">{title}</h1>
        {description ? <p className="mt-1 text-[13px] text-text-tertiary">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
