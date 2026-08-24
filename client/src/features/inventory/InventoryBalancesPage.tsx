import { useQuery } from '@tanstack/react-query'
import { PackagePlus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listInventory } from '@/api/inventory'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { StockLevelBar } from '@/components/ui/StockLevelBar'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/States'
import { ReceiveStockDialog } from '@/features/inventory/ReceiveStockDialog'
import { ApiError } from '@/lib/apiError'
import type { InventoryBalance } from '@/types/api'

const PAGE_SIZE = 20

export function InventoryBalancesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const belowMinimumOnly = searchParams.get('belowMinimumOnly') === 'true'
  const page = Number(searchParams.get('page') ?? '1')
  const [receivingItem, setReceivingItem] = useState<InventoryBalance | null>(null)

  const query = useQuery({
    queryKey: ['inventory', { belowMinimumOnly, page }],
    queryFn: () => listInventory({ belowMinimumOnly, page, pageSize: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  })

  function updateParams(next: Record<string, string | boolean | number | undefined>) {
    const params = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === '' || value === false) params.delete(key)
      else params.set(key, String(value))
    }
    if (!('page' in next)) params.delete('page')
    setSearchParams(params)
  }

  return (
    <div>
      <PageHeader title="Estoque" description="Saldo físico, reservado e disponível por produto." />

      <div className="flex items-center gap-3 px-6 pt-4">
        <Checkbox
          label="Somente abaixo do mínimo"
          checked={belowMinimumOnly}
          onChange={(e) => updateParams({ belowMinimumOnly: e.target.checked })}
        />
      </div>

      <div className="p-6">
        <Panel className="overflow-x-auto">
          {query.isLoading ? (
            <LoadingRows rows={8} columns={3} />
          ) : query.isError ? (
            <ErrorState
              message={query.error instanceof ApiError ? query.error.message : 'Erro ao carregar estoque.'}
              onRetry={() => query.refetch()}
            />
          ) : !query.data || query.data.items.length === 0 ? (
            <EmptyState
              title="Nenhum item encontrado"
              description={belowMinimumOnly ? 'Nenhum produto está abaixo do estoque mínimo.' : undefined}
            />
          ) : (
            <>
              <table className="min-w-[680px] w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5 font-medium">Produto</th>
                    <th className="px-4 py-2.5 font-medium">Nível de estoque</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {query.data.items.map((item) => (
                    <tr key={item.productId} className="hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary">{item.productName}</p>
                        <p className="font-mono text-[11px] text-text-muted">{item.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StockLevelBar
                          onHandStock={item.onHandStock}
                          reservedStock={item.reservedStock}
                          minimumStock={item.minimumStock}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="secondary" size="sm" onClick={() => setReceivingItem(item)}>
                          <PackagePlus className="size-3.5" />
                          Receber
                        </Button>
                      </td>
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

      <ReceiveStockDialog open={!!receivingItem} item={receivingItem} onClose={() => setReceivingItem(null)} />
    </div>
  )
}
