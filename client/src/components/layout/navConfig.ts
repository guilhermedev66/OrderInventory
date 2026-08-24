import {
  ClipboardList,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Truck,
  Warehouse,
} from 'lucide-react'
import type { Role } from '@/types/api'

export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: Role[]
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/inventory', label: 'Estoque', icon: Warehouse, roles: ['Manager', 'Admin'] },
  { to: '/suppliers', label: 'Fornecedores', icon: Truck, roles: ['Manager', 'Admin'] },
  { to: '/orders', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/users', label: 'Usuários', icon: ShieldCheck, roles: ['Admin'] },
]
