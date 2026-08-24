import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[380px] rounded-lg border border-border bg-surface p-0 shadow-float backdrop:bg-slate-900/40 open:animate-[dialog-in_180ms_cubic-bezier(0.23,1,0.32,1)]"
    >
      <div className="p-5">
        <h2 className="text-[15px] font-semibold text-text-primary">{title}</h2>
        <p className="mt-1.5 text-[13px] text-text-tertiary">{description}</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? 'danger' : 'primary'} size="sm" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
