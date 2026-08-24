import type { ProblemDetails } from '@/types/api'

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetails | null

  constructor(status: number, problem: ProblemDetails | null, fallbackMessage: string) {
    super(problem?.detail ?? problem?.title ?? fallbackMessage)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }

  get fieldErrors(): Record<string, string[]> {
    return this.problem?.errors ?? {}
  }
}

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'Requisição inválida. Verifique os dados informados.',
  401: 'Sessão expirada ou inválida. Faça login novamente.',
  403: 'Você não tem permissão para executar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'A operação não pôde ser concluída no estado atual.',
  429: 'Muitas tentativas em pouco tempo. Aguarde e tente novamente.',
  500: 'Erro inesperado no servidor. Tente novamente em instantes.',
}

export function fallbackMessageForStatus(status: number): string {
  return STATUS_FALLBACKS[status] ?? 'Ocorreu um erro inesperado.'
}
