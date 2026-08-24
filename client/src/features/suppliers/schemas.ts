import { z } from 'zod'

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Informe o nome').max(200, 'Máximo de 200 caracteres'),
  contactEmail: z.string().email('E-mail inválido').max(320).optional().or(z.literal('')),
})
export type CreateSupplierFormValues = z.infer<typeof createSupplierSchema>

export const linkProductSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  supplierProductCode: z.string().max(100, 'Máximo de 100 caracteres').optional().or(z.literal('')),
})
export type LinkProductFormValues = z.infer<typeof linkProductSchema>
