import { useQuery } from '@tanstack/react-query'
import { History } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { listMovements } from '@/api/inventory'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/States'
import { Table, TableScroll, Th, Thead } from '@/components/ui/Table'
import { ApiError } from '@/lib/apiError'
import { formatDateTime } from '@/lib/format'
import { MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_TONE } from '@/lib/labels'

const PAGE_SIZE = 50

export function InventoryMovementsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const productId = searchParams.get('productId') ?? undefined
  const orderId = searchParams.get('orderId') ?? undefined
  const page = Number(searchParams.get('page') ?? '1')

  const query = useQuery({
    queryKey: ['movements', { productId, orderId, page }],
    queryFn: () => listMovements({ productId, orderId, page, pageSize: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  function clearFilters() {
    setSearchParams({})
  }

  return (
    <div>
      <PageHeader
        title="Movimentações de estoque"
        description="Histórico de recebimentos, reservas e atendimentos. Registro somente leitura."
      />

      {productId || orderId ? (
        <div className="flex items-center gap-2 px-6 pt-4 text-[13px] text-text-tertiary">
          Filtrado por {productId ? 'produto' : 'pedido'}
          <button onClick={clearFilters} className="font-medium text-accent hover:text-accent-hover">
            Limpar filtro
          </button>
        </div>
      ) : null}

      <div className="p-6">
        <Panel>
          {query.isLoading ? (
            <LoadingRows rows={10} columns={4} />
          ) : query.isError ? (
            <ErrorState
              message={query.error instanceof ApiError ? query.error.message : 'Erro ao carregar movimentações.'}
              onRetry={() => query.refetch()}
            />
          ) : !query.data || query.data.items.length === 0 ? (
            <EmptyState
              icon={History}
              title="Nenhuma movimentação encontrada"
              description={productId || orderId ? 'Ajuste ou limpe o filtro ativo.' : 'Recebimentos, reservas e atendimentos aparecerão aqui.'}
            />
          ) : (
            <>
              <TableScroll>
              <Table minWidth={680}>
                <Thead>
                  <Th>Tipo</Th>
                  <Th align="right">Quantidade</Th>
                  <Th>Origem</Th>
                  <Th>Data</Th>
                </Thead>
                <tbody className="divide-y divide-border">
                  {query.data.items.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-hover">
                      <td className="px-4 py-2.5">
                        <Badge tone={MOVEMENT_TYPE_TONE[m.type]}>{MOVEMENT_TYPE_LABEL[m.type]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">{m.quantity}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-text-muted">
                        {m.orderId ? (
                          <Link to={`/orders/${m.orderId}`} className="text-accent-subtle-text hover:text-accent hover:underline">
                            Pedido {m.orderId.slice(0, 8)}
                          </Link>
                        ) : m.supplierId ? (
                          `Fornecedor ${m.supplierId.slice(0, 8)}`
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-text-tertiary">{formatDateTime(m.occurredAtUtc)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              </TableScroll>
              <Pagination
                page={query.data.page}
                pageSize={query.data.pageSize}
                totalCount={query.data.totalCount}
                onPageChange={(p) => setSearchParams((prev) => ({ ...Object.fromEntries(prev), page: String(p) }))}
              />
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
