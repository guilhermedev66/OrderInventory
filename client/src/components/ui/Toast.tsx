import { useCallback, useRef, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { ToastContext } from '@/components/ui/toastContext'

type ToastTone = 'success' | 'danger' | 'info'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const toneClasses: Record<ToastTone, string> = {
  success: 'border-l-success',
  danger: 'border-l-danger',
  info: 'border-l-info',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = idRef.current++
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2"
        role="region"
        aria-label="Notificações"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              'animate-[toast-in_180ms_cubic-bezier(0.23,1,0.32,1)] rounded-sm border border-border border-l-2 bg-surface px-3.5 py-3 text-[13px] text-text-primary shadow-float',
              toneClasses[toast.tone],
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
