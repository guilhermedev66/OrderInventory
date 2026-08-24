import { Menu, PanelLeftClose } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '@/components/layout/navConfig'
import { UserMenu } from '@/components/layout/UserMenu'

export function Topbar({ onMenuClick, onSidebarToggle }: { onMenuClick: () => void; onSidebarToggle: () => void }) {
  const { pathname } = useLocation()
  const current = NAV_ITEMS.find((item) => item.end ? pathname === item.to : pathname.startsWith(item.to))
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenuClick} className="rounded-sm p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden" aria-label="Abrir menu de navegação"><Menu className="size-5" /></button>
        <button type="button" onClick={onSidebarToggle} className="hidden rounded-sm p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary lg:block" aria-label="Alternar largura da navegação"><PanelLeftClose className="size-[18px]" /></button>
        <div className="hidden h-5 w-px bg-border sm:block" />
        <span className="hidden text-[12px] font-medium text-text-tertiary sm:block">{current?.label ?? 'OrderInventory'}</span>
      </div>
      <UserMenu />
    </header>
  )
}
