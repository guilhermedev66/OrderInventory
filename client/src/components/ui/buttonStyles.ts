import { clsx } from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white border border-accent hover:bg-accent-hover active:bg-accent-active disabled:bg-accent/50 disabled:border-accent/50',
  secondary:
    'bg-surface text-text-primary border border-border-strong hover:bg-surface-hover disabled:text-text-muted',
  ghost: 'bg-transparent text-text-secondary border border-transparent hover:bg-surface-hover',
  danger: 'bg-danger text-white border border-danger hover:bg-danger-hover disabled:bg-danger/50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
}

export function buttonClassName(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return clsx(
    'inline-flex items-center justify-center rounded-sm font-medium transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}
