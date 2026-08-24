import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'

export function RequireAuth() {
  const { isAuthenticated, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
