import { describe, expect, it } from 'vitest'
import { ApiError, fallbackMessageForStatus } from '@/lib/apiError'

describe('ApiError', () => {
  it.each([400, 401, 403, 404, 409, 429, 500])('provides a message for HTTP %i', (status) => {
    expect(fallbackMessageForStatus(status)).not.toBe('Ocorreu um erro inesperado.')
  })

  it('prioritizes ProblemDetails detail and exposes validation errors', () => {
    const error = new ApiError(
      400,
      { detail: 'Dados inválidos.', errors: { Email: ['E-mail já cadastrado.'] } },
      'Fallback',
    )

    expect(error.message).toBe('Dados inválidos.')
    expect(error.fieldErrors).toEqual({ Email: ['E-mail já cadastrado.'] })
  })
})
