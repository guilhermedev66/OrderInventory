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
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-5">
      <div>
        <h1 className="text-[19px] font-semibold text-text-primary">{title}</h1>
        {description ? <p className="mt-0.5 text-[13px] text-text-tertiary">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
