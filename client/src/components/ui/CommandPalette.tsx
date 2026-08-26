import { Command } from 'cmdk'
import {
  ClipboardList,
  Package,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { NAV_ITEMS } from '@/components/layout/navConfig'

interface Entry {
  key: string
  label: string
  icon: LucideIcon
  to: string
}

/**
 * cmdk's Command.Dialog bundles Radix Dialog (focus trap, ESC, portal,
 * aria-combobox semantics) instead of hand-rolling a listbox — the one
 * class of control the interface-design guidance says to never hand-roll.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const isManagement = hasRole('Manager', 'Admin')
  const shortcutLabel = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K'

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const pages: Entry[] = useMemo(
    () =>
      NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles)).map((item) => ({
        key: `page-${item.to}`,
        label: item.label,
        icon: item.icon,
        to: item.to,
      })),
    [hasRole],
  )

  const actions: Entry[] = useMemo(() => {
    if (isManagement) {
      return [
        { key: 'action-new-product', label: 'Novo produto', icon: Plus, to: '/products/new' },
        { key: 'action-receive-stock', label: 'Receber estoque', icon: PackagePlus, to: '/inventory' },
        { key: 'action-new-supplier', label: 'Novo fornecedor', icon: Truck, to: '/suppliers' },
        { key: 'action-orders', label: 'Ver pedidos', icon: ClipboardList, to: '/orders' },
        ...(hasRole('Admin') ? [{ key: 'action-users', label: 'Gerenciar usuários', icon: ShieldCheck, to: '/admin/users' }] : []),
      ]
    }
    return [
      { key: 'action-new-order', label: 'Novo pedido', icon: Plus, to: '/orders' },
      { key: 'action-products', label: 'Ver produtos', icon: Package, to: '/products' },
    ]
  }, [isManagement, hasRole])

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-2 rounded-xs border border-border bg-surface-inset px-2.5 text-[12px] text-text-tertiary transition-colors hover:border-border-strong hover:text-text-secondary"
      >
        <Search className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden rounded-[3px] border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:block">
          {shortcutLabel}
        </kbd>
      </button>

      <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Busca global"
      shouldFilter
      overlayClassName="fixed inset-0 z-50 bg-[#020617]/60 backdrop-blur-sm animate-[toast-in_150ms_cubic-bezier(0.23,1,0.32,1)]"
      contentClassName="fixed left-1/2 top-[18%] z-50 w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-surface shadow-float animate-[dialog-in_180ms_cubic-bezier(0.23,1,0.32,1)]"
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
        <Command.Input
          autoFocus
          placeholder="Navegar ou executar uma ação…"
          className="h-12 w-full bg-transparent text-[14px] text-text-primary outline-none placeholder:text-text-muted"
        />
        <kbd className="hidden shrink-0 rounded-xs border border-border-strong bg-surface-inset px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:block">
          ESC
        </kbd>
      </div>

      <Command.List className="max-h-[360px] overflow-y-auto p-2">
        <Command.Empty className="px-4 py-10 text-center text-[13px] text-text-tertiary">Nada encontrado.</Command.Empty>

        <Command.Group
          heading="Navegar"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-text-muted"
        >
          {pages.map(({ key, label, icon: Icon, to }) => (
            <Command.Item
              key={key}
              value={label}
              onSelect={() => go(to)}
              className="flex cursor-pointer items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-[13px] text-text-secondary data-[selected=true]:bg-accent-subtle data-[selected=true]:text-accent-subtle-text"
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group
          heading="Ações rápidas"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-text-muted"
        >
          {actions.map(({ key, label, icon: Icon, to }) => (
            <Command.Item
              key={key}
              value={label}
              onSelect={() => go(to)}
              className="flex cursor-pointer items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-[13px] text-text-secondary data-[selected=true]:bg-accent-subtle data-[selected=true]:text-accent-subtle-text"
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>

      <div className="flex items-center gap-3 border-t border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">
        <span>↑↓ navegar</span>
        <span>↵ selecionar</span>
        <span>esc fechar</span>
      </div>
      </Command.Dialog>
    </>
  )
}
