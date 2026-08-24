import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { buttonClassName, type ButtonSize, type ButtonVariant } from '@/components/ui/buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonClassName(variant, size, className)}
        {...props}
      >
        {loading ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
