import { createContext } from 'react'
import type { SessionIdentity } from '@/auth/jwt'
import type { Role } from '@/types/api'

export interface AuthContextValue {
  identity: SessionIdentity | null
  isAuthenticated: boolean
  isReady: boolean
  sessionExpired: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
  acknowledgeExpiry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
