import axios, { AxiosError } from 'axios'
import { tokenStorage } from '@/auth/tokenStorage'
import { ApiError, fallbackMessageForStatus } from '@/lib/apiError'
import type { ProblemDetails } from '@/types/api'

export const UNAUTHORIZED_EVENT = 'oi:unauthorized'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetails>) => {
    const status = error.response?.status ?? 0
    const problem = error.response?.data ?? null

    if (status === 401) {
      tokenStorage.clear()
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError(0, null, 'Não foi possível conectar ao servidor. Verifique sua conexão.'),
      )
    }

    return Promise.reject(new ApiError(status, problem, fallbackMessageForStatus(status)))
  },
)
