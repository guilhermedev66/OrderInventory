import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '@/api/auth'
import { AuthContext, type AuthContextValue } from '@/auth/authContext'
import { decodeToken, isExpired, type SessionIdentity } from '@/auth/jwt'
import { tokenStorage } from '@/auth/tokenStorage'
import { UNAUTHORIZED_EVENT } from '@/lib/http'
import type { Role } from '@/types/api'

function readIdentity(): SessionIdentity | null {
  const token = tokenStorage.get()
  if (!token) return null
  const identity = decodeToken(token)
  if (!identity || isExpired(identity)) {
    tokenStorage.clear()
    return null
  }
  return identity
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<SessionIdentity | null>(readIdentity)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    function handleUnauthorized() {
      setIdentity((current) => {
        if (current) setSessionExpired(true)
        return null
      })
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const applyToken = useCallback((token: string) => {
    tokenStorage.set(token)
    setIdentity(decodeToken(token))
    setSessionExpired(false)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password)
      applyToken(response.accessToken)
    },
    [applyToken],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.register(email, password)
      applyToken(response.accessToken)
    },
    [applyToken],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    setIdentity(null)
    setSessionExpired(false)
  }, [])

  const hasRole = useCallback(
    (...roles: Role[]) => roles.some((role) => identity?.roles.includes(role)),
    [identity],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      identity,
      isAuthenticated: identity !== null,
      isReady: true,
      sessionExpired,
      login,
      register,
      logout,
      hasRole,
      acknowledgeExpiry: () => setSessionExpired(false),
    }),
    [identity, sessionExpired, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
