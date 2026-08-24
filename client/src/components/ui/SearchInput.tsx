import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (draft !== value) onChange(draft)
    }, 300)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  return (
    <div className="relative w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-sm border border-border-strong bg-surface-inset py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25"
      />
    </div>
  )
}
