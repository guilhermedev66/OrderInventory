import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

export function PublicOnly() {
  const { isAuthenticated, isReady } = useAuth()
  if (!isReady) return null
  if (isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}
