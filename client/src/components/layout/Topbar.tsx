import { Menu } from 'lucide-react'
import { UserMenu } from '@/components/layout/UserMenu'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-sm p-1.5 text-text-secondary hover:bg-surface-hover lg:hidden"
        aria-label="Abrir menu de navegação"
      >
        <Menu className="size-5" />
      </button>
      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  )
}
