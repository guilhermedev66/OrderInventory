import { z } from 'zod'

export const addItemSchema = z.object({
  productId: z.string().min(1, 'Selecione um produto'),
  quantity: z.coerce.number().int('Deve ser um número inteiro').min(1, 'Informe ao menos 1 unidade'),
})
export type AddItemFormValues = z.input<typeof addItemSchema>
export type AddItemSubmitValues = z.output<typeof addItemSchema>
