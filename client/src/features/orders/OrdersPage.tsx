import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createOrder, listManagementOrders, listMyOrders } from '@/api/orders'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { selectControlClasses, SelectChevron } from '@/components/ui/Field'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/States'
import { useToast } from '@/components/ui/useToast'
import { ApiError } from '@/lib/apiError'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/labels'
import type { OrderStatus } from '@/types/api'

const PAGE_SIZE = 20
const STATUS_OPTIONS: OrderStatus[] = ['Draft', 'Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled']

export function OrdersPage() {
  const { hasRole } = useAuth()
  const isManagement = hasRole('Manager', 'Admin')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { push } = useToast()

  const status = (searchParams.get('status') as OrderStatus | null) ?? undefined
  const page = Number(searchParams.get('page') ?? '1')

  const query = useQuery({
    queryKey: ['orders', { isManagement, status, page }],
    queryFn: () =>
      isManagement
        ? listManagementOrders({ status, page, pageSize: PAGE_SIZE })
        : listMyOrders({ status, page, pageSize: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/orders/${order.id}`)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Erro ao criar pedido.', 'danger'),
  })

  function updateParams(next: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === '') params.delete(key)
      else params.set(key, String(value))
    }
    if (!('page' in next)) params.delete('page')
    setSearchParams(params)
  }

  return (
    <div>
      <PageHeader
        title={isManagement ? 'Pedidos' : 'Meus pedidos'}
        description={
          isManagement
            ? 'Pedidos de todos os clientes e ações de confirmação, processamento e conclusão.'
            : 'Seus pedidos e o andamento de cada um.'
        }
        actions={
          !isManagement ? (
            <Button
              variant="primary"
              size="sm"
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Plus className="size-4" />
              Novo pedido
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 px-6 pt-4">
        <div className="relative">
          <select
            aria-label="Filtrar pedidos por status"
            value={status ?? ''}
            onChange={(e) => updateParams({ status: e.target.value || undefined })}
            className={clsx(selectControlClasses, 'h-9 w-auto min-w-[180px]')}
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>

      <div className="p-6">
        <Panel className="overflow-x-auto">
          {query.isLoading ? (
            <LoadingRows rows={8} columns={5} />
          ) : query.isError ? (
            <ErrorState
              message={query.error instanceof ApiError ? query.error.message : 'Erro ao carregar pedidos.'}
              onRetry={() => query.refetch()}
            />
          ) : !query.data || query.data.items.length === 0 ? (
            <EmptyState
              title="Nenhum pedido encontrado"
              description={!isManagement ? 'Crie um novo pedido para começar.' : undefined}
            />
          ) : (
            <>
              <table className="min-w-[700px] w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5 font-medium">Pedido</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Itens</th>
                    <th className="px-4 py-2.5 text-right font-medium">Total</th>
                    <th className="px-4 py-2.5 font-medium">Atualizado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {query.data.items.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') navigate(`/orders/${order.id}`)
                      }}
                      tabIndex={0}
                      className="cursor-pointer hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    >
                      <td className="px-4 py-2.5 font-mono text-[12px] text-text-secondary">
                        {order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={ORDER_STATUS_TONE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                        {order.items.length}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-text-primary">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-2.5 text-text-tertiary">{formatDateTime(order.updatedAtUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={query.data.page}
                pageSize={query.data.pageSize}
                totalCount={query.data.totalCount}
                onPageChange={(p) => updateParams({ page: p })}
              />
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
