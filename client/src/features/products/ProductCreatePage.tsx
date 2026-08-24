import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { createProduct } from '@/api/products'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/useToast'
import {
  createProductSchema,
  type CreateProductFormValues,
  type CreateProductSubmitValues,
} from '@/features/products/schemas'
import { ApiError } from '@/lib/apiError'

export function ProductCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push } = useToast()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormValues, unknown, CreateProductSubmitValues>({
    resolver: zodResolver(createProductSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: CreateProductSubmitValues) =>
      createProduct({ ...values, description: values.description || null }),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      push('Produto criado com sucesso.', 'success')
      navigate(`/products/${product.id}`)
    },
    onError: (err) => {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        for (const [field, messages] of Object.entries(err.fieldErrors)) {
          setError(field.toLowerCase() as keyof CreateProductFormValues, { message: messages[0] })
        }
      } else {
        push(err instanceof ApiError ? err.message : 'Erro ao criar produto.', 'danger')
      }
    },
  })

  return (
    <div>
      <PageHeader title="Novo produto" description="Cadastre um item no catálogo." />
      <div className="p-6">
        <Panel className="max-w-xl p-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <TextField label="Nome" required error={errors.name?.message} {...register('name')} />
            <TextField
              label="SKU"
              required
              hint="Salvo em maiúsculas automaticamente."
              error={errors.sku?.message}
              {...register('sku')}
            />
            <TextField label="Descrição" error={errors.description?.message} {...register('description')} />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Preço"
                type="number"
                step="0.01"
                min="0.01"
                required
                error={errors.price?.message}
                {...register('price')}
              />
              <TextField
                label="Estoque mínimo"
                type="number"
                step="1"
                min="0"
                required
                error={errors.minimumStock?.message}
                {...register('minimumStock')}
              />
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting || mutation.isPending}>
                Criar produto
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  )
}
