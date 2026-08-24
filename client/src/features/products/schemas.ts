import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Informe o nome').max(200, 'Máximo de 200 caracteres'),
  sku: z.string().min(1, 'Informe o SKU').max(64, 'Máximo de 64 caracteres'),
  description: z.string().max(1000, 'Máximo de 1000 caracteres').optional().or(z.literal('')),
  price: z.coerce.number().min(0.01, 'Informe um preço maior que zero'),
  minimumStock: z.coerce.number().int('Deve ser um número inteiro').min(0, 'Não pode ser negativo'),
})
// Form field values (what inputs hold, pre-coercion) vs. the parsed submit payload.
export type CreateProductFormValues = z.input<typeof createProductSchema>
export type CreateProductSubmitValues = z.output<typeof createProductSchema>

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Informe o nome').max(200, 'Máximo de 200 caracteres'),
  description: z.string().max(1000, 'Máximo de 1000 caracteres').optional().or(z.literal('')),
  minimumStock: z.coerce.number().int('Deve ser um número inteiro').min(0, 'Não pode ser negativo'),
})
export type UpdateProductFormValues = z.input<typeof updateProductSchema>
export type UpdateProductSubmitValues = z.output<typeof updateProductSchema>

export const changePriceSchema = z.object({
  price: z.coerce.number().min(0.01, 'Informe um preço maior que zero'),
})
export type ChangePriceFormValues = z.input<typeof changePriceSchema>
export type ChangePriceSubmitValues = z.output<typeof changePriceSchema>
