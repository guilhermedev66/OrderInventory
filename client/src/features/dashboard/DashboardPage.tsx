import { useQuery } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, ClipboardList, Package, PackagePlus, Plus, ShieldCheck, Truck, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listInventory, listMovements } from '@/api/inventory'
import { listProducts } from '@/api/products'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'
import { StatTile } from '@/components/ui/StatTile'
import { ErrorState, LoadingRows } from '@/components/ui/States'
import { stockState } from '@/components/ui/StockLevelBar'
import { useOrderStatusCounts } from '@/features/dashboard/useOrderStatusCounts'
import { formatDateTime } from '@/lib/format'
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_TONE, ORDER_STATUS_LABEL } from '@/lib/labels'
import type { OrderStatus } from '@/types/api'

const FLOW_STATUSES: OrderStatus[] = ['Draft', 'Pending', 'Confirmed', 'Processing', 'Completed']
const STATUS_COLORS: Record<OrderStatus, string> = {
  Draft: '#64748b', Pending: '#f0a323', Confirmed: '#3b82f6', Processing: '#8b5cf6', Completed: '#2fb787', Cancelled: '#e5484d',
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
  const { hasRole } = useAuth()
  const isAdmin = hasRole('Admin')
  const activeProducts = useQuery({ queryKey: ['dashboard-active-products'], queryFn: () => listProducts({ page: 1, pageSize: 1, includeInactive: false }) })
  const belowMinimum = useQuery({ queryKey: ['dashboard-below-minimum'], queryFn: () => listInventory({ page: 1, pageSize: 6, belowMinimumOnly: true }) })
  const recentMovements = useQuery({ queryKey: ['dashboard-recent-movements'], queryFn: () => listMovements({ page: 1, pageSize: 6 }) })
  const orderCounts = useOrderStatusCounts('management')
  const hasError = activeProducts.isError || belowMinimum.isError || recentMovements.isError || orderCounts.isError

  if (hasError) return <Panel><ErrorState message="Não foi possível carregar os indicadores operacionais." onRetry={() => { activeProducts.refetch(); belowMinimum.refetch(); recentMovements.refetch(); orderCounts.retry() }} /></Panel>

  const belowMinimumCount = belowMinimum.data?.totalCount ?? 0
  const pendingCount = orderCounts.counts.Pending

  return (
    <div className="space-y-5">
      <OrderPipelineOverview counts={orderCounts.counts} loading={orderCounts.isLoading} />

      <Panel className="flex flex-wrap overflow-hidden">
        <StatTile
          label="Produtos ativos"
          value={activeProducts.isLoading ? '—' : (activeProducts.data?.totalCount ?? 0)}
          icon={<Package className="size-4" />}
        />
        <StatTile
          label="Abaixo do mínimo"
          value={belowMinimum.isLoading ? '—' : belowMinimumCount}
          tone={belowMinimumCount > 0 ? 'warning' : 'neutral'}
          icon={<AlertTriangle className="size-4" />}
        />
        <StatTile
          label="Pedidos pendentes"
          value={orderCounts.isLoading ? '—' : pendingCount}
          tone={pendingCount > 0 ? 'warning' : 'neutral'}
          icon={<Clock className="size-4" />}
        />
      </Panel>

      <div className={clsx('grid gap-5', belowMinimumCount > 0 ? 'xl:grid-cols-[1.5fr_1fr]' : 'xl:grid-cols-[1fr_1fr]')}>
        <LowStock query={belowMinimum} />
        <RecentMovements query={recentMovements} />
      </div>
      <QuickActions management admin={isAdmin} activeProducts={activeProducts.data?.totalCount ?? 0} />
    </div>
  )
}

function UserDashboard() {
  const orderCounts = useOrderStatusCounts('mine')
  if (orderCounts.isError) return <Panel><ErrorState message="Não foi possível carregar o resumo dos pedidos." onRetry={() => orderCounts.retry()} /></Panel>
  return (
    <div className="space-y-5">
      <OrderPipelineOverview counts={orderCounts.counts} loading={orderCounts.isLoading} />
      <QuickActions />
    </div>
  )
}

/**
 * Single source of truth for order-status volume: previously the same five
 * counts were shown twice (a stat-card grid, then a donut chart repeating
 * them). This reads the real lifecycle left-to-right instead.
 */
function OrderPipelineOverview({ counts, loading }: { counts: Record<OrderStatus, number>; loading: boolean }) {
  const cancelled = counts.Cancelled

  return (
    <Panel className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title="Fluxo de pedidos" description="Volume em cada etapa do ciclo de vida" />
        {!loading && cancelled > 0 ? (
          <Badge tone="danger">
            {cancelled} cancelado{cancelled === 1 ? '' : 's'}
          </Badge>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-7 h-20 animate-pulse rounded-md bg-surface-inset" />
      ) : (
        <>
          {/* Below sm: a compact key-value list reads better than a rail forced to scroll. */}
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 sm:hidden">
            {FLOW_STATUSES.map((status) => {
              const value = counts[status]
              return (
                <div key={status} className="flex items-baseline justify-between gap-2 border-b border-border pb-2">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-tertiary">{ORDER_STATUS_LABEL[status]}</dt>
                  <dd
                    className="text-[18px] font-semibold tabular-nums tracking-[-0.02em]"
                    style={{ color: value > 0 ? STATUS_COLORS[status] : 'var(--color-text-muted)' }}
                  >
                    {value}
                  </dd>
                </div>
              )
            })}
          </dl>

          <div className="mt-8 hidden items-start sm:flex">
            {FLOW_STATUSES.map((status, index) => {
              const value = counts[status]
              const hasVolume = value > 0
              const isLast = index === FLOW_STATUSES.length - 1
              return (
                <div key={status} className={clsx('flex items-start', !isLast && 'min-w-[92px] flex-1')}>
                  <div className="flex min-w-[76px] flex-col items-center gap-2">
                    <span
                      className="text-[28px] font-semibold leading-none tabular-nums tracking-[-0.03em]"
                      style={{ color: hasVolume ? STATUS_COLORS[status] : 'var(--color-text-muted)' }}
                    >
                      {value}
                    </span>
                    <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] text-text-tertiary">
                      {ORDER_STATUS_LABEL[status]}
                    </span>
                  </div>
                  {!isLast ? (
                    <div
                      className="mx-2 mt-[13px] h-px flex-1"
                      style={{ background: hasVolume ? STATUS_COLORS[status] : 'var(--color-border-strong)' }}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Panel>
  )
}

function RecentMovements({ query }: { query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof listMovements>>>> }) {
  return <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><SectionTitle title="Movimentações recentes" description="Últimas alterações de estoque" /><Link to="/inventory/movements" className="text-[12px] font-semibold text-accent-subtle-text hover:text-accent">Ver todas</Link></div>{query.isLoading ? <LoadingRows rows={5} columns={3} /> : query.data?.items.length ? <ul className="divide-y divide-border">{query.data.items.map((movement) => <li key={movement.id} className="flex items-center gap-3 px-5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-inset text-info"><PackagePlus className="size-4" /></span><div className="min-w-0 flex-1"><Badge tone={MOVEMENT_TYPE_TONE[movement.type]}>{MOVEMENT_TYPE_LABEL[movement.type]}</Badge><p className="mt-1 truncate font-mono text-[10px] text-text-muted">Produto {movement.productId.slice(0, 8)}</p></div><strong className="text-[13px] tabular-nums text-text-secondary">{movement.quantity} un.</strong><time className="hidden text-[11px] text-text-muted sm:block">{formatDateTime(movement.occurredAtUtc)}</time></li>)}</ul> : <div className="flex h-48 flex-col items-center justify-center text-center"><Package className="mb-3 size-7 text-text-muted" /><p className="text-[13px] font-medium text-text-secondary">Nenhuma movimentação recente</p><p className="mt-1 text-[12px] text-text-muted">Recebimentos e reservas aparecerão aqui.</p></div>}</Panel>
}

function LowStock({ query }: { query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof listInventory>>>> }) {
  return <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><SectionTitle title="Estoque abaixo do mínimo" description="Itens que exigem atenção" /><Link to="/inventory?belowMinimumOnly=true" className="text-[12px] font-semibold text-accent-subtle-text hover:text-accent">Ver estoque</Link></div>{query.isLoading ? <LoadingRows rows={5} columns={3} /> : query.data?.items.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-[12px]"><thead><tr className="border-b border-border text-[10px] uppercase tracking-[0.1em] text-text-muted"><th className="px-5 py-3 font-medium">Produto</th><th className="px-4 py-3 text-right font-medium">Disponível</th><th className="px-4 py-3 text-right font-medium">Mínimo</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y divide-border">{query.data.items.map((item) => { const state = stockState(item.availableStock, item.minimumStock); return <tr key={item.productId} className="hover:bg-surface-hover"><td className="px-5 py-3"><p className="font-medium text-text-primary">{item.productName}</p><p className="font-mono text-[10px] text-text-muted">{item.sku}</p></td><td className="px-4 py-3 text-right tabular-nums text-text-secondary">{item.availableStock}</td><td className="px-4 py-3 text-right tabular-nums text-text-secondary">{item.minimumStock}</td><td className="px-5 py-3 text-right"><Badge tone={state === 'out' ? 'danger' : 'warning'}>{state === 'out' ? 'Crítico' : 'Atenção'}</Badge></td></tr> })}</tbody></table></div> : <div className="flex h-44 flex-col items-center justify-center"><CheckCircle2 className="mb-3 size-7 text-success" /><p className="text-[13px] font-medium text-text-secondary">Estoque em níveis adequados</p></div>}</Panel>
}

function QuickActions({ management = false, admin = false, activeProducts = 0 }: { management?: boolean; admin?: boolean; activeProducts?: number }) {
  const actions = management ? [
    { to: '/products/new', title: 'Novo produto', description: `${activeProducts} produtos ativos`, icon: Plus, color: 'text-accent bg-accent-subtle' },
    { to: '/inventory', title: 'Receber estoque', description: 'Registrar nova entrada', icon: Warehouse, color: 'text-info bg-info-subtle' },
    { to: '/suppliers', title: 'Novo fornecedor', description: 'Gerenciar parceiros', icon: Truck, color: 'text-success bg-success-subtle' },
    { to: '/orders', title: 'Ver pedidos', description: 'Acompanhar o fluxo', icon: ClipboardList, color: 'text-warning bg-warning-subtle' },
    ...(admin ? [{ to: '/admin/users', title: 'Gerenciar usuários', description: 'Criar contas e definir papéis', icon: ShieldCheck, color: 'text-danger bg-danger-subtle' }] : []),
  ] : [
    { to: '/orders', title: 'Novo pedido', description: 'Criar e adicionar itens', icon: Plus, color: 'text-accent bg-accent-subtle' },
    { to: '/products', title: 'Ver produtos', description: 'Consultar catálogo e preços', icon: Package, color: 'text-info bg-info-subtle' },
  ]
  return <Panel className="overflow-hidden"><div className="border-b border-border px-5 py-4"><SectionTitle title="Ações rápidas" description="Atalhos para tarefas frequentes" /></div><div className="divide-y divide-border">{actions.map(({ to, title, description, icon: Icon, color }) => <Link key={title} to={to} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-hover"><span className={`flex size-10 items-center justify-center rounded-sm ${color}`}><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><strong className="block text-[13px] font-medium text-text-primary">{title}</strong><span className="text-[11px] text-text-tertiary">{description}</span></span><ArrowRight className="size-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" /></Link>)}</div></Panel>
}

function SectionTitle({ title, description }: { title: string; description: string }) { return <div><h2 className="text-[14px] font-semibold text-text-primary">{title}</h2><p className="mt-0.5 text-[11px] text-text-muted">{description}</p></div> }
