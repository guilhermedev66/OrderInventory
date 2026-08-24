import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { getProduct, updateProduct } from '@/api/products'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Panel'
import { useToast } from '@/components/ui/useToast'
import {
  updateProductSchema,
  type UpdateProductFormValues,
  type UpdateProductSubmitValues,
} from '@/features/products/schemas'
import { ApiError } from '@/lib/apiError'

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { push } = useToast()

  const productQuery = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProductFormValues, unknown, UpdateProductSubmitValues>({
    resolver: zodResolver(updateProductSchema),
    values: productQuery.data
      ? {
          name: productQuery.data.name,
          description: productQuery.data.description ?? '',
          minimumStock: productQuery.data.minimumStock,
        }
      : undefined,
  })

  const mutation = useMutation({
    mutationFn: (values: UpdateProductSubmitValues) =>
      updateProduct(id!, { ...values, description: values.description || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      push('Produto atualizado.', 'success')
      navigate(`/products/${id}`)
    },
    onError: (err) => push(err instanceof ApiError ? err.message : 'Erro ao salvar produto.', 'danger'),
  })

  if (productQuery.isLoading || !productQuery.data) {
    return <div className="p-6 text-[13px] text-text-tertiary">Carregando…</div>
  }

  return (
    <div>
      <PageHeader title={`Editar ${productQuery.data.name}`} description={productQuery.data.sku} />
      <div className="p-6">
        <Panel className="max-w-xl p-6">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <TextField label="Nome" required error={errors.name?.message} {...register('name')} />
            <TextField label="Descrição" error={errors.description?.message} {...register('description')} />
            <TextField
              label="Estoque mínimo"
              type="number"
              step="1"
              min="0"
              required
              error={errors.minimumStock?.message}
              {...register('minimumStock')}
            />
            <p className="text-[12px] text-text-muted">
              SKU e preço não são editáveis por aqui — o preço tem um fluxo próprio de alteração.
            </p>

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting || mutation.isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  )
}
