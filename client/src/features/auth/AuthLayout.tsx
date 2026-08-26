import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const LEDGER_PREVIEW: Array<{ label: string; tone: 'success' | 'warning' | 'info'; sku: string; qty: string }> = [
  { label: 'Recebimento', tone: 'success', sku: 'SKU-2201', qty: '+40' },
  { label: 'Reserva', tone: 'warning', sku: 'SKU-1187', qty: '−6' },
  { label: 'Atendimento', tone: 'info', sku: 'SKU-1187', qty: '−6' },
]

export function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-rail p-12 lg:flex lg:flex-col lg:justify-between" aria-label="Sobre o OrderInventory">
        <div className="absolute -left-32 top-1/3 size-80 rounded-full bg-accent/10 blur-3xl" />
        <Logo className="relative" />
        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-subtle-text">Gestão operacional</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-text-primary">Pedidos e estoque sob controle.</h1>
          <p className="mt-4 max-w-sm text-[15px] leading-6 text-text-tertiary">Uma visão única para acompanhar catálogo, disponibilidade e execução de pedidos.</p>
          <div className="mt-9 rounded-lg border border-border bg-surface/70 p-4" aria-hidden="true">
            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">Livro de movimentações · somente leitura</p>
            <div className="space-y-2.5">
              {LEDGER_PREVIEW.map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5">
                    <Badge tone={row.tone}>{row.label}</Badge>
                    <span className="font-mono text-[11px] text-text-muted">{row.sku}</span>
                  </span>
                  <span className="font-mono text-[12px] tabular-nums text-text-secondary">{row.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="relative text-[11px] text-text-muted">OrderInventory · Operação segura e consistente</p>
      </section>
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8"><ThemeToggle /></div>
        <div className="w-full max-w-[420px]">
          <div className="mb-9 lg:hidden"><Logo /></div>
          <div className="mb-7"><h2 className="text-[26px] font-semibold tracking-[-0.03em] text-text-primary">{title}</h2><p className="mt-2 text-[14px] text-text-tertiary">{description}</p></div>
          <div className="rounded-lg border border-border bg-surface p-6 shadow-float sm:p-7">{children}</div>
          <div className="mt-5 text-center text-[13px] text-text-tertiary">{footer}</div>
        </div>
      </section>
    </main>
  )
}
