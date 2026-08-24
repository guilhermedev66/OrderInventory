import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { PublicOnly } from '@/auth/PublicOnly'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireRole } from '@/auth/RequireRole'
import { SessionWatcher } from '@/auth/SessionWatcher'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { queryClient } from '@/lib/queryClient'
import { ForbiddenPage } from '@/routes/ForbiddenPage'
import { NotFoundPage } from '@/routes/NotFoundPage'

const AdminUsersPage = lazy(() => import('@/features/admin/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })))
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const InventoryBalancesPage = lazy(() => import('@/features/inventory/InventoryBalancesPage').then((module) => ({ default: module.InventoryBalancesPage })))
const InventoryMovementsPage = lazy(() => import('@/features/inventory/InventoryMovementsPage').then((module) => ({ default: module.InventoryMovementsPage })))
const OrderDetailPage = lazy(() => import('@/features/orders/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })))
const OrdersPage = lazy(() => import('@/features/orders/OrdersPage').then((module) => ({ default: module.OrdersPage })))
const ProductCreatePage = lazy(() => import('@/features/products/ProductCreatePage').then((module) => ({ default: module.ProductCreatePage })))
const ProductDetailPage = lazy(() => import('@/features/products/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })))
const ProductEditPage = lazy(() => import('@/features/products/ProductEditPage').then((module) => ({ default: module.ProductEditPage })))
const ProductsListPage = lazy(() => import('@/features/products/ProductsListPage').then((module) => ({ default: module.ProductsListPage })))
const SuppliersPage = lazy(() => import('@/features/suppliers/SuppliersPage').then((module) => ({ default: module.SuppliersPage })))

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <SessionWatcher />
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-canvas text-[13px] text-text-tertiary">Carregando interface…</div>}>
            <Routes>
              <Route element={<PublicOnly />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route index element={<DashboardPage />} />

                  <Route path="products" element={<ProductsListPage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route element={<RequireRole roles={['Manager', 'Admin']} />}>
                    <Route path="products/new" element={<ProductCreatePage />} />
                    <Route path="products/:id/edit" element={<ProductEditPage />} />
                    <Route path="inventory" element={<InventoryBalancesPage />} />
                    <Route path="inventory/movements" element={<InventoryMovementsPage />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                  </Route>

                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="orders/:id" element={<OrderDetailPage />} />

                  <Route element={<RequireRole roles={['Admin']} />}>
                    <Route path="admin/users" element={<AdminUsersPage />} />
                  </Route>

                  <Route path="403" element={<ForbiddenPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
