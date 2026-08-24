import { createContext } from 'react'

export interface ToastContextValue {
  push: (message: string, tone?: 'success' | 'danger' | 'info') => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
