import { ChevronDown, LogOut } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { ROLE_LABEL } from '@/lib/labels'
import { useClickOutside } from '@/lib/useClickOutside'

export function UserMenu() {
  const { identity, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  if (!identity) return null

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const roleLabel = identity.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ')

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-surface-hover"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-accent-subtle text-[12px] font-semibold text-accent-subtle-text">
          {identity.email.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden flex-col sm:flex">
          <span className="text-[13px] font-medium leading-tight text-text-primary">{identity.email}</span>
          <span className="text-[11px] leading-tight text-text-tertiary">{roleLabel}</span>
        </span>
        <ChevronDown className="size-3.5 text-text-muted" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1.5 w-44 origin-top-right rounded-sm border border-border bg-surface py-1 shadow-float animate-[dialog-in_150ms_cubic-bezier(0.23,1,0.32,1)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-hover hover:text-text-primary"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  )
}
