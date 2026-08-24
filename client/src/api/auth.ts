import { http } from '@/lib/http'
import type { AuthResponse } from '@/types/api'

export function login(email: string, password: string) {
  return http.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data)
}

export function register(email: string, password: string) {
  return http.post<AuthResponse>('/api/auth/register', { email, password }).then((r) => r.data)
}
