import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { listProducts } from '@/api/products'
import { linkSupplierProduct } from '@/api/suppliers'
import { Button } from '@/components/ui/Button'
import { SelectField, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/useToast'
import { linkProductSchema, type LinkProductFormValues } from '@/features/suppliers/schemas'
import { ApiError } from '@/lib/apiError'
import type { Supplier } from '@/types/api'

export function LinkProductDialog({
  open,
  supplier,
  onClose,
}: {
  open: boolean
  supplier: Supplier | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const { push } = useToast()

  const productsQuery = useQuery({
    queryKey: ['products-for-select'],
    queryFn: () => listProducts({ page: 1, pageSize: 100, includeInactive: false }),
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LinkProductFormValues>({ resolver: zodResolver(linkProductSchema) })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      reset({ productId: '', supplierProductCode: '' })
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: (values: LinkProductFormValues) =>
      linkSupplierProduct(supplier!.id, values.productId, values.supplierProductCode || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      push(`Produto vinculado a ${supplier?.name}.`, 'success')
      onClose()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Erro ao vincular produto.', 'danger'),
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
          <h2 className="text-[15px] font-semibold text-text-primary">Vincular produto</h2>
          <p className="mt-1 text-[13px] text-text-tertiary">{supplier?.name}</p>

          <div className="mt-4 flex flex-col gap-4">
            <SelectField label="Produto" required error={errors.productId?.message} {...register('productId')}>
              <option value="">Selecione…</option>
              {productsQuery.data?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </SelectField>
            <TextField
              label="Código do produto no fornecedor"
              hint="Opcional"
              error={errors.supplierProductCode?.message}
              {...register('supplierProductCode')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isSubmitting || mutation.isPending}>
            Vincular
          </Button>
        </div>
      </form>
    </dialog>
  )
}
