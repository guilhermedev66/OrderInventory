import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'

const controlClasses =
  'h-10 w-full rounded-sm border border-border-strong bg-surface-inset px-3 text-[13px] text-text-primary shadow-inner shadow-black/10 placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60'

/** Shared native-select styling: appearance-none body + a manually drawn chevron, kept in sync across every select in the app. */
export const selectControlClasses = clsx(controlClasses, 'appearance-none pr-9 cursor-pointer')

export function SelectChevron() {
  return <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
}

interface FieldWrapperProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export function FieldWrapper({ label, htmlFor, error, hint, required, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-text-secondary">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const generatedId = useId()
    const fieldId = id ?? generatedId
    return (
      <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          className={clsx(controlClasses, error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/20', className)}
          {...props}
        />
      </FieldWrapper>
    )
  },
)
TextField.displayName = 'TextField'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, id, className, children, ...props }, ref) => {
    const generatedId = useId()
    const fieldId = id ?? generatedId
    return (
      <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            required={required}
            aria-invalid={!!error}
            className={clsx(selectControlClasses, error && 'border-danger', className)}
            {...props}
          >
            {children}
          </select>
          <SelectChevron />
        </div>
      </FieldWrapper>
    )
  },
)
SelectField.displayName = 'SelectField'
