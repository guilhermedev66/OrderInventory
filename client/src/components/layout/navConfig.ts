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

export const OPERATION_ITEMS: NavItem[] = [
  { to: '/', label: 'Painel', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'Pedidos', icon: ClipboardList },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/inventory', label: 'Estoque', icon: Warehouse, roles: ['Manager', 'Admin'] },
  { to: '/suppliers', label: 'Fornecedores', icon: Truck, roles: ['Manager', 'Admin'] },
]

export const ADMIN_ITEMS: NavItem[] = [
  { to: '/admin/users', label: 'Usuários', icon: ShieldCheck, roles: ['Admin'] },
]

export const NAV_ITEMS = [...OPERATION_ITEMS, ...ADMIN_ITEMS]
