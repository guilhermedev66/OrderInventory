import { Link, type LinkProps } from 'react-router-dom'
import { buttonClassName } from '@/components/ui/buttonStyles'

interface LinkButtonProps extends LinkProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function LinkButton({ variant = 'secondary', size = 'md', className, ...props }: LinkButtonProps) {
  return <Link className={buttonClassName(variant, size, className)} {...props} />
}
