import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listInventory } from '@/api/inventory'
import { getProduct, setProductStatus } from '@/api/products'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { StockLevelBar } from '@/components/ui/StockLevelBar'
import { ErrorState } from '@/components/ui/States'
import { useToast } from '@/components/ui/useToast'
import { ChangePriceDialog } from '@/features/products/ChangePriceDialog'
import { ApiError } from '@/lib/apiError'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { findAcrossPages } from '@/lib/paginate'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { push } = useToast()
  const { hasRole } = useAuth()
  const isManagement = hasRole('Manager', 'Admin')
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  })

  const balanceQuery = useQuery({
    queryKey: ['inventory-balance', id],
    queryFn: () =>
      findAcrossPages(
        (page) => listInventory({ page, pageSize: 50 }),
        (item) => item.productId === id,
      ),
    enabled: !!id && isManagement,
  })

  const statusMutation = useMutation({
    mutationFn: (active: boolean) => setProductStatus(id!, active),
    onSuccess: (_, active) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      push(active ? 'Produto ativado.' : 'Produto inativado.', 'success')
      setStatusDialogOpen(false)
    },
    onError: (err) => {
      push(err instanceof ApiError ? err.message : 'Erro ao alterar status.', 'danger')
      setStatusDialogOpen(false)
    },
  })

  if (productQuery.isLoading) {
    return <div className="p-6 text-[13px] text-text-tertiary">Carregando…</div>
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <ErrorState
        message={
          productQuery.error instanceof ApiError && productQuery.error.status === 404
            ? 'Produto não encontrado.'
            : 'Erro ao carregar produto.'
        }
        onRetry={() => productQuery.refetch()}
      />
    )
  }

  const product = productQuery.data
  const belowMinimum = product.availableStock < product.minimumStock

  return (
    <div>
      <PageHeader
        title={product.name}
        description={product.sku}
        actions={
          isManagement ? (
            <>
              <LinkButton to={`/products/${product.id}/edit`} variant="secondary" size="sm">
                <Pencil className="size-3.5" />
                Editar
              </LinkButton>
              <Button variant="secondary" size="sm" onClick={() => setPriceDialogOpen(true)}>
                Alterar preço
              </Button>
              <Button
                variant={product.isActive ? 'danger' : 'primary'}
                size="sm"
                onClick={() => setStatusDialogOpen(true)}
              >
                {product.isActive ? 'Inativar' : 'Ativar'}
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <h2 className="text-[13px] font-semibold text-text-primary">Detalhes</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <dt className="text-text-tertiary">Status</dt>
              <dd className="mt-0.5">
                <Badge tone={product.isActive ? 'success' : 'neutral'}>
                  {product.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-text-tertiary">Preço</dt>
              <dd className="mt-0.5 tabular-nums font-medium text-text-primary">
                {formatCurrency(product.price)}
              </dd>
            </div>
            <div>
              <dt className="text-text-tertiary">Estoque mínimo</dt>
              <dd className="mt-0.5 tabular-nums text-text-primary">{product.minimumStock}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary">Disponível</dt>
              <dd className="mt-0.5 tabular-nums text-text-primary">
                {product.availableStock}
                {belowMinimum ? (
                  <span className="ml-2 inline-block align-middle">
                    <Badge tone="warning">Abaixo do mínimo</Badge>
                  </span>
                ) : null}
              </dd>
            </div>
            {product.description ? (
              <div className="col-span-2">
                <dt className="text-text-tertiary">Descrição</dt>
                <dd className="mt-0.5 text-text-secondary">{product.description}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-text-tertiary">Criado em</dt>
              <dd className="mt-0.5 text-text-secondary">{formatDateTime(product.createdAtUtc)}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary">Atualizado em</dt>
              <dd className="mt-0.5 text-text-secondary">{formatDateTime(product.updatedAtUtc)}</dd>
            </div>
          </dl>
        </Panel>

        {isManagement ? (
          <Panel className="p-5">
            <h2 className="text-[13px] font-semibold text-text-primary">Estoque</h2>
            {balanceQuery.isLoading ? (
              <p className="mt-3 text-[13px] text-text-tertiary">Carregando…</p>
            ) : balanceQuery.data ? (
              <div className="mt-3">
                <StockLevelBar
                  onHandStock={balanceQuery.data.onHandStock}
                  reservedStock={balanceQuery.data.reservedStock}
                  minimumStock={balanceQuery.data.minimumStock}
                />
              </div>
            ) : (
              <p className="mt-3 text-[13px] text-text-tertiary">
                Nenhum recebimento registrado para este produto ainda.
              </p>
            )}
            <Link
              to={`/inventory/movements?productId=${product.id}`}
              className="mt-4 inline-block text-[12px] font-medium text-accent hover:text-accent-hover"
            >
              Ver movimentações →
            </Link>
          </Panel>
        ) : null}
      </div>

      <ConfirmDialog
        open={statusDialogOpen}
        title={product.isActive ? 'Inativar produto' : 'Ativar produto'}
        description={
          product.isActive
            ? 'Produtos inativos deixam de aparecer no catálogo para usuários comuns e não podem receber novos pedidos.'
            : 'O produto voltará a aparecer no catálogo e poderá receber pedidos.'
        }
        confirmLabel={product.isActive ? 'Inativar' : 'Ativar'}
        destructive={product.isActive}
        loading={statusMutation.isPending}
        onConfirm={() => statusMutation.mutate(!product.isActive)}
        onCancel={() => setStatusDialogOpen(false)}
      />

      <ChangePriceDialog
        open={priceDialogOpen}
        productId={product.id}
        currentPrice={product.price}
        onClose={() => setPriceDialogOpen(false)}
      />
    </div>
  )
}
