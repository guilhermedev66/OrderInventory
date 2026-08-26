import { useQuery } from '@tanstack/react-query'
import { Package, Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listProducts } from '@/api/products'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Checkbox'
import { LinkButton } from '@/components/ui/LinkButton'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { SearchInput } from '@/components/ui/SearchInput'
import { stockState } from '@/components/ui/StockLevelBar'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/States'
import { Table, TableScroll, Th, Thead } from '@/components/ui/Table'
import { ApiError } from '@/lib/apiError'
import { formatCurrency } from '@/lib/format'

const PAGE_SIZE = 20

export function ProductsListPage() {
  const { hasRole } = useAuth()
  const isManagement = hasRole('Manager', 'Admin')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const includeInactive = isManagement && searchParams.get('includeInactive') === 'true'
  const page = Number(searchParams.get('page') ?? '1')

  const query = useQuery({
    queryKey: ['products', { search, includeInactive, page }],
    queryFn: () => listProducts({ search, includeInactive, page, pageSize: PAGE_SIZE }),
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
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos, preços e estoque mínimo."
        actions={
          isManagement ? (
            <LinkButton to="/products/new" variant="primary" size="sm">
              <Plus className="size-4" />
              Novo produto
            </LinkButton>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3 px-6 pt-4">
        <SearchInput
          value={search}
          onChange={(v) => updateParams({ search: v })}
          placeholder="Buscar por nome ou SKU"
        />
        {isManagement ? (
          <Checkbox
            label="Incluir inativos"
            checked={includeInactive}
            onChange={(e) => updateParams({ includeInactive: e.target.checked })}
          />
        ) : null}
      </div>

      <div className="p-6">
        <Panel>
          {query.isLoading ? (
            <LoadingRows rows={8} columns={5} />
          ) : query.isError ? (
            <ErrorState
              message={query.error instanceof ApiError ? query.error.message : 'Erro ao carregar produtos.'}
              onRetry={() => query.refetch()}
            />
          ) : !query.data || query.data.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title={search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              description={search ? 'Ajuste a busca ou os filtros.' : 'Cadastre o primeiro produto do catálogo.'}
              action={
                isManagement && !search ? (
                  <LinkButton to="/products/new" variant="secondary" size="sm">
                    <Plus className="size-3.5" />
                    Novo produto
                  </LinkButton>
                ) : undefined
              }
            />
          ) : (
            <>
              <TableScroll>
              <Table minWidth={720}>
                <Thead>
                  <Th>Produto</Th>
                  <Th>SKU</Th>
                  <Th align="right">Preço</Th>
                  <Th align="right">Disponível</Th>
                  <Th>Status</Th>
                </Thead>
                <tbody className="divide-y divide-border">
                  {query.data.items.map((product) => {
                    const state = stockState(product.availableStock, product.minimumStock)
                    return (
                      <tr
                        key={product.id}
                        onClick={() => navigate(`/products/${product.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') navigate(`/products/${product.id}`)
                        }}
                        tabIndex={0}
                        className="cursor-pointer hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                      >
                        <td className="px-4 py-2.5 font-medium text-text-primary">{product.name}</td>
                        <td className="px-4 py-2.5 font-mono text-[12px] text-text-tertiary">{product.sku}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                          {product.availableStock}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5">
                            {!product.isActive ? <Badge tone="neutral">Inativo</Badge> : null}
                            {state === 'out' ? (
                              <Badge tone="danger">Sem estoque</Badge>
                            ) : state === 'low' ? (
                              <Badge tone="warning">Abaixo do mínimo</Badge>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
              </TableScroll>
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
