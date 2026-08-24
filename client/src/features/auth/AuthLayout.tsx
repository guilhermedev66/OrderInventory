import { Boxes, ShieldCheck, Workflow, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/Logo'

const capabilities: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Boxes, text: 'Estoque transacional e rastreável' },
  { icon: Workflow, text: 'Pedidos com workflow operacional' },
  { icon: ShieldCheck, text: 'Acesso protegido por perfil' },
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
          <ul className="mt-9 space-y-4">{capabilities.map(({ icon: Icon, text }) => <li key={text} className="flex items-center gap-3 text-[13px] text-text-secondary"><span className="flex size-9 items-center justify-center rounded-sm border border-accent/20 bg-accent-subtle text-accent-subtle-text"><Icon className="size-4" /></span>{text}</li>)}</ul>
        </div>
        <p className="relative text-[11px] text-text-muted">OrderInventory · Operação segura e consistente</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
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
