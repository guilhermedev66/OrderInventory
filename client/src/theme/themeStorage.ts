import type { ThemePreference } from '@/theme/themeContext'

const STORAGE_KEY = 'oi_theme'

export const themeStorage = {
  get(): ThemePreference | null {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  },
  set(preference: ThemePreference): void {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  },
}
