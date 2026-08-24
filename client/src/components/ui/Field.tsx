import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'

const controlClasses =
  'h-9 w-full rounded-sm border border-border-strong bg-surface-inset px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60'

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
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          className={clsx(controlClasses, 'appearance-none bg-[position:right_10px_center] bg-no-repeat', error && 'border-danger', className)}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    )
  },
)
SelectField.displayName = 'SelectField'
