import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { changeProductPrice } from '@/api/products'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/useToast'
import {
  changePriceSchema,
  type ChangePriceFormValues,
  type ChangePriceSubmitValues,
} from '@/features/products/schemas'
import { ApiError } from '@/lib/apiError'

export function ChangePriceDialog({
  open,
  productId,
  currentPrice,
  onClose,
}: {
  open: boolean
  productId: string
  currentPrice: number
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const { push } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePriceFormValues, unknown, ChangePriceSubmitValues>({
    resolver: zodResolver(changePriceSchema),
    values: { price: currentPrice },
  })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      reset({ price: currentPrice })
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, currentPrice, reset])

  const mutation = useMutation({
    mutationFn: (values: ChangePriceSubmitValues) => changeProductPrice(productId, values.price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      push('Preço atualizado.', 'success')
      onClose()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Erro ao alterar preço.', 'danger'),
  })

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className="m-auto w-[340px] rounded-lg border border-border bg-surface p-0 shadow-float backdrop:bg-slate-900/40 open:animate-[dialog-in_180ms_cubic-bezier(0.23,1,0.32,1)]"
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="p-5">
          <h2 className="text-[15px] font-semibold text-text-primary">Alterar preço</h2>
          <div className="mt-4">
            <TextField
              label="Novo preço"
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              required
              error={errors.price?.message}
              {...register('price')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isSubmitting || mutation.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </dialog>
  )
}
