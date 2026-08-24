import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { createSupplier } from '@/api/suppliers'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/useToast'
import { createSupplierSchema, type CreateSupplierFormValues } from '@/features/suppliers/schemas'
import { ApiError } from '@/lib/apiError'

export function CreateSupplierDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const { push } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSupplierFormValues>({ resolver: zodResolver(createSupplierSchema) })

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      reset({ name: '', contactEmail: '' })
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, reset])

  const mutation = useMutation({
    mutationFn: (values: CreateSupplierFormValues) =>
      createSupplier({ name: values.name, contactEmail: values.contactEmail || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      push('Fornecedor criado.', 'success')
      onClose()
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Erro ao criar fornecedor.', 'danger'),
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
          <h2 className="text-[15px] font-semibold text-text-primary">Novo fornecedor</h2>
          <div className="mt-4 flex flex-col gap-4">
            <TextField label="Nome" required autoFocus error={errors.name?.message} {...register('name')} />
            <TextField
              label="E-mail de contato"
              type="email"
              hint="Opcional"
              error={errors.contactEmail?.message}
              {...register('contactEmail')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={isSubmitting || mutation.isPending}>
            Criar
          </Button>
        </div>
      </form>
    </dialog>
  )
}
