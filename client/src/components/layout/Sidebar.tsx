import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { ADMIN_ITEMS, OPERATION_ITEMS, type NavItem } from '@/components/layout/navConfig'
import { Logo } from '@/components/ui/Logo'

export function Sidebar({ collapsed = false, onNavigate, onToggle }: { collapsed?: boolean; onNavigate?: () => void; onToggle?: () => void }) {
  const { hasRole } = useAuth()
  const visible = (items: NavItem[]) => items.filter((item) => !item.roles || hasRole(...item.roles))
  const operations = visible(OPERATION_ITEMS)
  const administration = visible(ADMIN_ITEMS)

  return (
    <nav className={clsx('flex h-full shrink-0 flex-col border-r border-rail-border bg-rail text-rail-text transition-[width] duration-200', collapsed ? 'w-[72px]' : 'w-64')} aria-label="Navegação principal">
      <div className={clsx('flex h-16 items-center border-b border-rail-border', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Logo compact={collapsed} />
      </div>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-5">
        <NavGroup label="Operações" items={operations} collapsed={collapsed} onNavigate={onNavigate} />
        {administration.length > 0 ? <NavGroup label="Administração" items={administration} collapsed={collapsed} onNavigate={onNavigate} /> : null}
      </div>
      <div className="border-t border-rail-border p-2">
        <div className={clsx('mb-2 flex items-center gap-2 px-2 py-2 text-[11px] text-text-muted', collapsed && 'justify-center px-0')} title="API e banco de dados disponíveis">
          <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span>
          {collapsed ? null : <span>Sistema operacional</span>}
        </div>
        {onToggle ? (
          <button type="button" onClick={onToggle} className={clsx('flex h-9 w-full items-center rounded-sm text-[12px] text-rail-text transition-colors hover:bg-rail-hover hover:text-rail-text-active', collapsed ? 'justify-center' : 'gap-2 px-3')} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir menu' : undefined}>
            {collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span>Recolher menu</span></>}
          </button>
        ) : null}
      </div>
    </nav>
  )
}

function NavGroup({ label, items, collapsed, onNavigate }: { label: string; items: NavItem[]; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <div>
      {collapsed ? null : <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>}
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} onClick={onNavigate} title={collapsed ? item.label : undefined} className={({ isActive }) => clsx('relative flex h-10 items-center rounded-sm text-[13px] font-medium transition-all', collapsed ? 'justify-center' : 'gap-3 px-3', isActive ? 'bg-accent-subtle text-accent-subtle-text before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent' : 'text-rail-text hover:bg-rail-hover hover:text-rail-text-active')}>
              <item.icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
              {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
