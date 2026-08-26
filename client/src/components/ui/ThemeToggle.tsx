import { clsx } from 'clsx'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/theme/useTheme'
import type { ThemePreference } from '@/theme/themeContext'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Tema claro', icon: Sun },
  { value: 'system', label: 'Tema do sistema', icon: Monitor },
  { value: 'dark', label: 'Tema escuro', icon: Moon },
]

/**
 * A rectangular segmented control (radius-xs, not a rounded pill) so the
 * toggle reads as another stamped control in the same ledger language as
 * Badge and StockLevelBar, not a generic iOS-style switch.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div role="radiogroup" aria-label="Preferência de tema" className="flex items-center gap-0.5 rounded-xs border border-border bg-surface-inset p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={clsx(
              'flex size-7 items-center justify-center rounded-[3px] transition-colors duration-150',
              active ? 'bg-accent text-white shadow-sm' : 'text-text-tertiary hover:bg-surface-hover hover:text-text-primary',
            )}
          >
            <Icon className="size-[15px]" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
