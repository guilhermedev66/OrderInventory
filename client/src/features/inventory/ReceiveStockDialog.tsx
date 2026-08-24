import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { listSuppliers } from '@/api/suppliers'
import { receiveStock } from '@/api/inventory'
import { Button } from '@/components/ui/Button'
import { TextField, SelectField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/useToast'
import {
  receiveStockSchema,
  type ReceiveStockFormValues,
  type ReceiveStockSubmitValues,
} from '@/features/inventory/schemas'
import { ApiError } from '@/lib/apiError'
import type { InventoryBalance } from '@/types/api'

export function ReceiveStockDialog({
  open,
  item,
  onClose,
}: {
  open: boolean
  item: InventoryBalance | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const { push } = useToast()

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-for-select'],
    queryFn: () => listSuppliers({ page: 1, pageSize: 100, includeInactive: false }),
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReceiveStockFormValues, unknown, ReceiveStockSubmitValues>({
    resolver: zodResolver(receiveStockSchema),
  })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      reset({ quantity: 1, supplierId: '' })
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: (values: ReceiveStockSubmitValues) =>
      receiveStock(item!.productId, {
        quantity: values.quantity,
        supplierId: values.supplierId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-balance', item?.productId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      push(`Recebimento registrado para ${item?.productName}.`, 'success')
      onClose()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Erro ao registrar recebimento.', 'danger'),
  })

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[380px] rounded-lg border border-border bg-surface p-0 shadow-float backdrop:bg-slate-900/40 open:animate-[dialog-in_180ms_cubic-bezier(0.23,1,0.32,1)]"
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="p-5">
          <h2 className="text-[15px] font-semibold text-text-primary">Receber estoque</h2>
          <p className="mt-1 text-[13px] text-text-tertiary">{item?.productName}</p>

          <div className="mt-4 flex flex-col gap-4">
            <TextField
              label="Quantidade"
              type="number"
              step="1"
              min="1"
              autoFocus
              required
              error={errors.quantity?.message}
              {...register('quantity')}
            />
            <SelectField label="Fornecedor" hint="Opcional" error={errors.supplierId?.message} {...register('supplierId')}>
              <option value="">Sem fornecedor</option>
              {suppliersQuery.data?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isSubmitting || mutation.isPending}>
            Registrar
          </Button>
        </div>
      </form>
    </dialog>
  )
}
