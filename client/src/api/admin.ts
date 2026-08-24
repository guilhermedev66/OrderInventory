import { http } from '@/lib/http'
import type { CreateUserRequest, CreateUserResponse } from '@/types/api'

export function createUser(body: CreateUserRequest) {
  return http.post<CreateUserResponse>('/api/admin/users', body).then((r) => r.data)
}
