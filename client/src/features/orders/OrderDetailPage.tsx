import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  getMyOrder,
  listManagementOrders,
  processOrder,
  submitOrder,
} from '@/api/orders'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OrderStatusRail } from '@/components/ui/OrderStatusRail'
import { Panel } from '@/components/ui/Panel'
import { ErrorState } from '@/components/ui/States'
import { useToast } from '@/components/ui/useToast'
import { AddItemDialog } from '@/features/orders/AddItemDialog'
import { getOrderPermissions } from '@/features/orders/orderPermissions'
import { ApiError } from '@/lib/apiError'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { findAcrossPages } from '@/lib/paginate'

type DialogKind = 'submit' | 'cancel' | 'confirm' | 'process' | 'complete' | null

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { hasRole } = useAuth()
  const isManagement = hasRole('Manager', 'Admin')
  const queryClient = useQueryClient()
  const { push } = useToast()
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogKind>(null)

  const orderQuery = useQuery({
    queryKey: ['order', id, isManagement],
    queryFn: () =>
      isManagement
        ? findAcrossPages(
            (page) => listManagementOrders({ page, pageSize: 50 }),
            (o) => o.id === id,
          )
        : getMyOrder(id!),
    enabled: !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['order', id] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
    queryClient.invalidateQueries({ queryKey: ['movements'] })
  }

  function useAction(mutationFn: () => Promise<void>, successMessage: string) {
    return useMutation({
      mutationFn,
      onSuccess: () => {
        invalidate()
        push(successMessage, 'success')
        setDialog(null)
      },
      onError: (err) => {
        push(err instanceof ApiError ? err.message : 'Não foi possível concluir a ação.', 'danger')
        setDialog(null)
      },
    })
  }

  const submitMutation = useAction(() => submitOrder(id!), 'Pedido enviado para análise.')
  const cancelMutation = useAction(() => cancelOrder(id!), 'Pedido cancelado.')
  const confirmMutation = useAction(() => confirmOrder(id!), 'Pedido confirmado.')
  const processMutation = useAction(() => processOrder(id!), 'Pedido em processamento.')
  const completeMutation = useAction(() => completeOrder(id!), 'Pedido concluído.')

  if (orderQuery.isLoading) {
    return <div className="p-6 text-[13px] text-text-tertiary">Carregando…</div>
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <ErrorState
        message={
          !orderQuery.data || (orderQuery.error instanceof ApiError && orderQuery.error.status === 404)
            ? 'Pedido não encontrado.'
            : 'Erro ao carregar pedido.'
        }
        onRetry={() => orderQuery.refetch()}
      />
    )
  }

  const order = orderQuery.data
  const { canAddItem, canSubmit, canCancel, canConfirm, canProcess, canComplete } =
    getOrderPermissions(order.status, order.items.length, isManagement)

  return (
    <div>
      <PageHeader
        title={`Pedido ${order.id.slice(0, 8)}`}
        description={`Criado em ${formatDateTime(order.createdAtUtc)}`}
        actions={
          <>
            {canAddItem ? (
              <Button variant="secondary" size="sm" onClick={() => setAddItemOpen(true)}>
                <Plus className="size-3.5" />
                Adicionar item
              </Button>
            ) : null}
            {canSubmit ? (
              <Button variant="primary" size="sm" onClick={() => setDialog('submit')}>
                Enviar pedido
              </Button>
            ) : null}
            {canConfirm ? (
              <Button variant="primary" size="sm" onClick={() => setDialog('confirm')}>
                Confirmar
              </Button>
            ) : null}
            {canProcess ? (
              <Button variant="primary" size="sm" onClick={() => setDialog('process')}>
                Iniciar processamento
              </Button>
            ) : null}
            {canComplete ? (
              <Button variant="primary" size="sm" onClick={() => setDialog('complete')}>
                Concluir
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="danger" size="sm" onClick={() => setDialog('cancel')}>
                Cancelar pedido
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        <Panel className="overflow-x-auto p-5">
          <OrderStatusRail order={order} />
        </Panel>

        <Panel className="overflow-x-auto">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[13px] font-semibold text-text-primary">Itens</h2>
          </div>
          {order.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-text-tertiary">
              {canAddItem ? 'Nenhum item ainda. Adicione produtos para enviar o pedido.' : 'Nenhum item neste pedido.'}
            </p>
          ) : (
            <table className="min-w-[620px] w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5 font-medium">Produto</th>
                  <th className="px-4 py-2.5 text-right font-medium">Qtd.</th>
                  <th className="px-4 py-2.5 text-right font-medium">Preço unit.</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-text-primary">{item.productName}</p>
                      <p className="font-mono text-[11px] text-text-muted">{item.sku}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-text-secondary">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-text-primary">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={3} className="px-4 py-3 text-right text-[13px] font-semibold text-text-primary">
                    Total do pedido
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[15px] font-semibold text-text-primary">
                    {formatCurrency(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="text-[13px] font-semibold text-text-primary">Linha do tempo</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-3">
            <Timestamp label="Enviado" value={order.submittedAtUtc} />
            <Timestamp label="Confirmado" value={order.confirmedAtUtc} />
            <Timestamp label="Em processamento" value={order.processingAtUtc} />
            <Timestamp label="Concluído" value={order.completedAtUtc} />
            <Timestamp label="Cancelado" value={order.cancelledAtUtc} />
          </dl>
        </Panel>
      </div>

      <AddItemDialog open={addItemOpen} orderId={order.id} onClose={() => setAddItemOpen(false)} />

      <ConfirmDialog
        open={dialog === 'submit'}
        title="Enviar pedido"
        description="O pedido será enviado para análise e não poderá mais receber novos itens."
        confirmLabel="Enviar"
        loading={submitMutation.isPending}
        onConfirm={() => submitMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'cancel'}
        title="Cancelar pedido"
        description="Esta ação não pode ser desfeita. Reservas de estoque associadas serão liberadas."
        confirmLabel="Cancelar pedido"
        destructive
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'confirm'}
        title="Confirmar pedido"
        description="O estoque de cada item será reservado. Se algum item não tiver saldo disponível, a confirmação será rejeitada por completo."
        confirmLabel="Confirmar"
        loading={confirmMutation.isPending}
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'process'}
        title="Iniciar processamento"
        description="O pedido passará para a etapa de processamento."
        confirmLabel="Iniciar"
        loading={processMutation.isPending}
        onConfirm={() => processMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'complete'}
        title="Concluir pedido"
        description="O estoque físico e reservado dos itens será baixado definitivamente."
        confirmLabel="Concluir"
        loading={completeMutation.isPending}
        onConfirm={() => completeMutation.mutate()}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}

function Timestamp({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-text-tertiary">{label}</dt>
      <dd className="mt-0.5 text-text-secondary">{value ? formatDateTime(value) : <span className="text-text-muted">—</span>}</dd>
    </div>
  )
}
