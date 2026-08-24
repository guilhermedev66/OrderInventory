import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { clsx } from 'clsx'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, id, className, ...props }: CheckboxProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  return (
    <label htmlFor={checkboxId} className="flex items-center gap-2 text-[13px] text-text-secondary select-none">
      <input
        type="checkbox"
        id={checkboxId}
        className={clsx(
          'size-3.5 rounded-xs border-border-strong text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  )
}
