import { useEffect } from 'react'
import { useAuth } from '@/auth/useAuth'
import { useToast } from '@/components/ui/useToast'

/** Surfaces a toast the moment a 401 forces the session closed. */
export function SessionWatcher() {
  const { sessionExpired, acknowledgeExpiry } = useAuth()
  const { push } = useToast()

  useEffect(() => {
    if (sessionExpired) {
      push('Sessão expirada. Faça login novamente.', 'danger')
      acknowledgeExpiry()
    }
  }, [sessionExpired, acknowledgeExpiry, push])

  return null
}
