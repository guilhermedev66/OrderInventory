import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, CircleDashed, ClipboardCheck, ClipboardList, Package, PackagePlus, Plus, Truck, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listInventory, listMovements } from '@/api/inventory'
import { listProducts } from '@/api/products'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'
import { ErrorState, LoadingRows } from '@/components/ui/States'
import { useOrderStatusCounts } from '@/features/dashboard/useOrderStatusCounts'
import { formatDateTime } from '@/lib/format'
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_TONE, ORDER_STATUS_LABEL } from '@/lib/labels'
import type { OrderStatus } from '@/types/api'

const DISTRIBUTION_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled']
const STATUS_COLORS: Record<OrderStatus, string> = {
  Draft: '#64748b', Pending: '#f59e0b', Confirmed: '#3b82f6', Processing: '#8b5cf6', Completed: '#22c55e', Cancelled: '#f43f5e',
}

export function DashboardPage() {
  const { identity, hasRole } = useAuth()
  const isManagement = hasRole('Manager', 'Admin')
  const name = identity?.email.split('@')[0].split(/[._-]/)[0] ?? 'usuário'
  const greetingName = name.charAt(0).toUpperCase() + name.slice(1)

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7">
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-[28px]">Olá, {greetingName}!</h1>
        <p className="mt-1.5 text-[14px] text-text-tertiary">Aqui está o resumo da sua operação hoje.</p>
      </header>
      {isManagement ? <ManagementDashboard /> : <UserDashboard />}
    </div>
  )
}

function ManagementDashboard() {
  const activeProducts = useQuery({ queryKey: ['dashboard-active-products'], queryFn: () => listProducts({ page: 1, pageSize: 1, includeInactive: false }) })
  const belowMinimum = useQuery({ queryKey: ['dashboard-below-minimum'], queryFn: () => listInventory({ page: 1, pageSize: 6, belowMinimumOnly: true }) })
  const recentMovements = useQuery({ queryKey: ['dashboard-recent-movements'], queryFn: () => listMovements({ page: 1, pageSize: 6 }) })
  const orderCounts = useOrderStatusCounts('management')
  const hasError = activeProducts.isError || belowMinimum.isError || recentMovements.isError || orderCounts.isError

  if (hasError) return <Panel><ErrorState message="Não foi possível carregar os indicadores operacionais." onRetry={() => { activeProducts.refetch(); belowMinimum.refetch(); recentMovements.refetch(); orderCounts.retry() }} /></Panel>

  return (
    <div className="space-y-5">
      <MetricGrid counts={orderCounts.counts} loading={orderCounts.isLoading} />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <OrderDistribution counts={orderCounts.counts} loading={orderCounts.isLoading} />
        <RecentMovements query={recentMovements} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <LowStock query={belowMinimum} />
        <QuickActions management activeProducts={activeProducts.data?.totalCount ?? 0} />
      </div>
    </div>
  )
}

function UserDashboard() {
  const orderCounts = useOrderStatusCounts('mine')
  if (orderCounts.isError) return <Panel><ErrorState message="Não foi possível carregar o resumo dos pedidos." onRetry={() => orderCounts.retry()} /></Panel>
  return (
    <div className="space-y-5">
      <MetricGrid counts={orderCounts.counts} loading={orderCounts.isLoading} />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <OrderDistribution counts={orderCounts.counts} loading={orderCounts.isLoading} />
        <QuickActions />
      </div>
    </div>
  )
}

function MetricGrid({ counts, loading }: { counts: Record<OrderStatus, number>; loading: boolean }) {
  const cards: Array<{ status: 'Pending' | 'Confirmed' | 'Processing' | 'Completed'; icon: typeof ClipboardList; tone: 'warning' | 'info' | 'accent' | 'success' }> = [
    { status: 'Pending' as const, icon: ClipboardList, tone: 'warning' },
    { status: 'Confirmed' as const, icon: ClipboardCheck, tone: 'info' },
    { status: 'Processing' as const, icon: CircleDashed, tone: 'accent' },
    { status: 'Completed' as const, icon: CheckCircle2, tone: 'success' },
  ]
  const toneClasses = { warning: 'text-warning bg-warning-subtle', info: 'text-info bg-info-subtle', accent: 'text-accent bg-accent-subtle', success: 'text-success bg-success-subtle' }
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo de pedidos">
      {cards.map(({ status, icon: Icon, tone }) => (
        <Panel key={status} className="relative overflow-hidden p-4">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">{ORDER_STATUS_LABEL[status]}</p><p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-text-primary">{loading ? '—' : counts[status]}</p></div>
            <span className={`flex size-10 items-center justify-center rounded-md ${toneClasses[tone]}`}><Icon className="size-5" strokeWidth={1.8} /></span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: STATUS_COLORS[status] }} />
        </Panel>
      ))}
    </section>
  )
}

function OrderDistribution({ counts, loading }: { counts: Record<OrderStatus, number>; loading: boolean }) {
  const total = DISTRIBUTION_STATUSES.reduce((sum, status) => sum + counts[status], 0)
  const segments = DISTRIBUTION_STATUSES.map((status, index) => {
    const start = total ? DISTRIBUTION_STATUSES.slice(0, index).reduce((sum, item) => sum + counts[item], 0) / total * 100 : 0
    const end = total ? start + counts[status] / total * 100 : 0
    return `${STATUS_COLORS[status]} ${start}% ${end}%`
  })
  return (
    <Panel className="p-5">
      <SectionTitle title="Pedidos por status" description="Distribuição atual dos pedidos" />
      {loading ? <div className="mt-5 h-44 animate-pulse rounded-md bg-surface-inset" /> : total === 0 ? <div className="flex h-44 items-center justify-center text-[13px] text-text-tertiary">Nenhum pedido para distribuir.</div> : (
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
          <div className="relative size-40 shrink-0 rounded-full" style={{ background: `conic-gradient(${segments.join(',')})` }}><div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-surface"><strong className="text-2xl text-text-primary">{total}</strong><span className="text-[11px] text-text-tertiary">pedidos</span></div></div>
          <ul className="grid w-full gap-2.5">
            {DISTRIBUTION_STATUSES.map((status) => <li key={status} className="flex items-center justify-between gap-5 text-[12px]"><span className="flex items-center gap-2 text-text-secondary"><span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />{ORDER_STATUS_LABEL[status]}</span><strong className="tabular-nums text-text-primary">{counts[status]}</strong></li>)}
          </ul>
        </div>
      )}
    </Panel>
  )
}

function RecentMovements({ query }: { query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof listMovements>>>> }) {
  return <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><SectionTitle title="Movimentações recentes" description="Últimas alterações de estoque" /><Link to="/inventory/movements" className="text-[12px] font-semibold text-accent-subtle-text hover:text-accent">Ver todas</Link></div>{query.isLoading ? <LoadingRows rows={5} columns={3} /> : query.data?.items.length ? <ul className="divide-y divide-border">{query.data.items.map((movement) => <li key={movement.id} className="flex items-center gap-3 px-5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-inset text-info"><PackagePlus className="size-4" /></span><div className="min-w-0 flex-1"><Badge tone={MOVEMENT_TYPE_TONE[movement.type]}>{MOVEMENT_TYPE_LABEL[movement.type]}</Badge><p className="mt-1 truncate font-mono text-[10px] text-text-muted">Produto {movement.productId.slice(0, 8)}</p></div><strong className="text-[13px] tabular-nums text-text-secondary">{movement.quantity} un.</strong><time className="hidden text-[11px] text-text-muted sm:block">{formatDateTime(movement.occurredAtUtc)}</time></li>)}</ul> : <div className="flex h-48 flex-col items-center justify-center text-center"><Package className="mb-3 size-7 text-text-muted" /><p className="text-[13px] font-medium text-text-secondary">Nenhuma movimentação recente</p><p className="mt-1 text-[12px] text-text-muted">Recebimentos e reservas aparecerão aqui.</p></div>}</Panel>
}

function LowStock({ query }: { query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof listInventory>>>> }) {
  return <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><SectionTitle title="Estoque abaixo do mínimo" description="Itens que exigem atenção" /><Link to="/inventory?belowMinimumOnly=true" className="text-[12px] font-semibold text-accent-subtle-text hover:text-accent">Ver estoque</Link></div>{query.isLoading ? <LoadingRows rows={5} columns={3} /> : query.data?.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-[12px]"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[0.1em] text-text-muted"><th className="px-5 py-3 font-medium">Produto</th><th className="px-4 py-3 text-right font-medium">Disponível</th><th className="px-4 py-3 text-right font-medium">Mínimo</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y divide-border">{query.data.items.map((item) => <tr key={item.productId} className="hover:bg-surface-hover"><td className="px-5 py-3"><p className="font-medium text-text-primary">{item.productName}</p><p className="font-mono text-[10px] text-text-muted">{item.sku}</p></td><td className="px-4 py-3 text-right tabular-nums text-text-secondary">{item.availableStock}</td><td className="px-4 py-3 text-right tabular-nums text-text-secondary">{item.minimumStock}</td><td className="px-5 py-3 text-right"><Badge tone={item.availableStock === 0 ? 'danger' : 'warning'}>{item.availableStock === 0 ? 'Crítico' : 'Atenção'}</Badge></td></tr>)}</tbody></table></div> : <div className="flex h-44 flex-col items-center justify-center"><CheckCircle2 className="mb-3 size-7 text-success" /><p className="text-[13px] font-medium text-text-secondary">Estoque em níveis adequados</p></div>}</Panel>
}

function QuickActions({ management = false, activeProducts = 0 }: { management?: boolean; activeProducts?: number }) {
  const actions = management ? [
    { to: '/products/new', title: 'Novo produto', description: `${activeProducts} produtos ativos`, icon: Plus, color: 'text-accent bg-accent-subtle' },
    { to: '/inventory', title: 'Receber estoque', description: 'Registrar nova entrada', icon: Warehouse, color: 'text-info bg-info-subtle' },
    { to: '/suppliers', title: 'Novo fornecedor', description: 'Gerenciar parceiros', icon: Truck, color: 'text-success bg-success-subtle' },
    { to: '/orders', title: 'Ver pedidos', description: 'Acompanhar o fluxo', icon: ClipboardList, color: 'text-warning bg-warning-subtle' },
  ] : [
    { to: '/orders', title: 'Novo pedido', description: 'Criar e adicionar itens', icon: Plus, color: 'text-accent bg-accent-subtle' },
    { to: '/products', title: 'Ver produtos', description: 'Consultar catálogo e preços', icon: Package, color: 'text-info bg-info-subtle' },
  ]
  return <Panel className="overflow-hidden"><div className="border-b border-border px-5 py-4"><SectionTitle title="Ações rápidas" description="Atalhos para tarefas frequentes" /></div><div className="divide-y divide-border">{actions.map(({ to, title, description, icon: Icon, color }) => <Link key={title} to={to} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-hover"><span className={`flex size-10 items-center justify-center rounded-sm ${color}`}><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><strong className="block text-[13px] font-medium text-text-primary">{title}</strong><span className="text-[11px] text-text-tertiary">{description}</span></span><ArrowRight className="size-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" /></Link>)}</div></Panel>
}

function SectionTitle({ title, description }: { title: string; description: string }) { return <div><h2 className="text-[14px] font-semibold text-text-primary">{title}</h2><p className="mt-0.5 text-[11px] text-text-muted">{description}</p></div> }
