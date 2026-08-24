import { z } from 'zod'

export const receiveStockSchema = z.object({
  quantity: z.coerce.number().int('Deve ser um número inteiro').min(1, 'Informe ao menos 1 unidade'),
  supplierId: z.string().optional().or(z.literal('')),
})
export type ReceiveStockFormValues = z.input<typeof receiveStockSchema>
export type ReceiveStockSubmitValues = z.output<typeof receiveStockSchema>
