import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ClipboardList, Package, Warehouse } from 'lucide-react'
import { Link } from 'react-router-dom'
import { listInventory, listMovements } from '@/api/inventory'
import { listProducts } from '@/api/products'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Panel } from '@/components/ui/Panel'
import { ErrorState, LoadingRows } from '@/components/ui/States'
import { StatTile } from '@/components/ui/StatTile'
import { useOrderStatusCounts } from '@/features/dashboard/useOrderStatusCounts'
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_TONE, ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/labels'
import { formatDateTime } from '@/lib/format'
import type { OrderStatus } from '@/types/api'

export function DashboardPage() {
  const { identity, hasRole } = useAuth()
  const isManagement = hasRole('Manager', 'Admin')

  return (
    <div>
      <PageHeader title="Painel" description={`Bem-vindo(a), ${identity?.email ?? ''}`} />
      <div className="p-6">{isManagement ? <ManagementDashboard /> : <UserDashboard />}</div>
    </div>
  )
}

function ManagementDashboard() {
  const activeProducts = useQuery({
    queryKey: ['dashboard-active-products'],
    queryFn: () => listProducts({ page: 1, pageSize: 1, includeInactive: false }),
  })
  const belowMinimum = useQuery({
    queryKey: ['dashboard-below-minimum'],
    queryFn: () => listInventory({ page: 1, pageSize: 8, belowMinimumOnly: true }),
  })
  const recentMovements = useQuery({
    queryKey: ['dashboard-recent-movements'],
    queryFn: () => listMovements({ page: 1, pageSize: 8 }),
  })
  const { counts, isLoading: countsLoading, isError: countsError, retry: retryCounts } =
    useOrderStatusCounts('management')

  const hasError = activeProducts.isError || belowMinimum.isError || recentMovements.isError || countsError

  if (hasError) {
    return (
      <Panel>
        <ErrorState
          message="Não foi possível carregar os indicadores operacionais."
          onRetry={() => {
            activeProducts.refetch()
            belowMinimum.refetch()
            recentMovements.refetch()
            retryCounts()
          }}
        />
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-wrap">
        <StatTile
          label="Produtos ativos"
          value={activeProducts.data?.totalCount ?? '—'}
          icon={<Package className="size-4" />}
        />
        <StatTile
          label="Abaixo do mínimo"
          value={belowMinimum.data?.totalCount ?? '—'}
          tone={(belowMinimum.data?.totalCount ?? 0) > 0 ? 'danger' : 'neutral'}
          icon={<AlertTriangle className="size-4" />}
        />
        <StatTile
          label="Pedidos pendentes"
          value={countsLoading ? '—' : counts.Pending}
          tone={counts.Pending > 0 ? 'warning' : 'neutral'}
          icon={<ClipboardList className="size-4" />}
        />
        <StatTile
          label="Em processamento"
          value={countsLoading ? '—' : counts.Processing}
          icon={<Warehouse className="size-4" />}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-text-primary">Estoque abaixo do mínimo</h2>
            <Link to="/inventory?belowMinimumOnly=true" className="text-[12px] font-medium text-accent hover:text-accent-hover">
              Ver estoque
            </Link>
          </div>
          {belowMinimum.isLoading ? (
            <LoadingRows rows={4} columns={3} />
          ) : belowMinimum.data && belowMinimum.data.items.length > 0 ? (
            <ul className="divide-y divide-border">
              {belowMinimum.data.items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                  <div>
                    <p className="font-medium text-text-primary">{item.productName}</p>
                    <p className="font-mono text-[11px] text-text-muted">{item.sku}</p>
                  </div>
                  <Badge tone="warning">
                    {item.availableStock} / mín. {item.minimumStock}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-[13px] text-text-tertiary">
              Nenhum produto abaixo do estoque mínimo.
            </p>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-text-primary">Movimentações recentes</h2>
            <Link to="/inventory/movements" className="text-[12px] font-medium text-accent hover:text-accent-hover">
              Ver todas
            </Link>
          </div>
          {recentMovements.isLoading ? (
            <LoadingRows rows={4} columns={3} />
          ) : recentMovements.data && recentMovements.data.items.length > 0 ? (
            <ul className="divide-y divide-border">
              {recentMovements.data.items.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                  <Badge tone={MOVEMENT_TYPE_TONE[m.type]}>{MOVEMENT_TYPE_LABEL[m.type]}</Badge>
                  <span className="tabular-nums text-text-secondary">{m.quantity} un.</span>
                  <span className="text-[12px] text-text-muted">{formatDateTime(m.occurredAtUtc)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-[13px] text-text-tertiary">Nenhuma movimentação recente.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}

function UserDashboard() {
  const { counts, isLoading, isError, retry } = useOrderStatusCounts('mine')
  const statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Completed']

  if (isError) {
    return (
      <Panel>
        <ErrorState message="Não foi possível carregar o resumo dos pedidos." onRetry={() => retry()} />
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-wrap">
        {statuses.map((status) => (
          <StatTile
            key={status}
            label={ORDER_STATUS_LABEL[status]}
            value={isLoading ? '—' : counts[status]}
            icon={<ClipboardList className="size-4" />}
          />
        ))}
      </Panel>

      <Panel className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((status) => (
            <Badge key={status} tone={ORDER_STATUS_TONE[status]}>
              {ORDER_STATUS_LABEL[status]}: {isLoading ? '—' : counts[status]}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Link to="/products" className="text-[13px] font-medium text-accent hover:text-accent-hover">
            Ver catálogo de produtos →
          </Link>
        </div>
        <div className="mt-2 flex gap-2">
          <Link to="/orders" className="text-[13px] font-medium text-accent hover:text-accent-hover">
            Ver meus pedidos →
          </Link>
        </div>
      </Panel>
    </div>
  )
}
