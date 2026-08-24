import { clsx } from 'clsx'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Logo } from '@/components/ui/Logo'
import { NAV_ITEMS } from '@/components/layout/navConfig'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { hasRole } = useAuth()
  const items = NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles))

  return (
    <nav
      className="flex h-full w-60 shrink-0 flex-col bg-rail text-rail-text"
      aria-label="Navegação principal"
    >
      <div className="flex h-14 items-center border-b border-rail-border px-4">
        <Logo mono className="text-white" />
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-sm px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-rail-hover text-rail-text-active'
                    : 'text-rail-text hover:bg-rail-hover hover:text-rail-text-active',
                )
              }
            >
              <item.icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
