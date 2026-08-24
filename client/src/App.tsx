import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { PublicOnly } from '@/auth/PublicOnly'
import { RequireAuth } from '@/auth/RequireAuth'
import { RequireRole } from '@/auth/RequireRole'
import { SessionWatcher } from '@/auth/SessionWatcher'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { InventoryBalancesPage } from '@/features/inventory/InventoryBalancesPage'
import { InventoryMovementsPage } from '@/features/inventory/InventoryMovementsPage'
import { OrderDetailPage } from '@/features/orders/OrderDetailPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { ProductCreatePage } from '@/features/products/ProductCreatePage'
import { ProductDetailPage } from '@/features/products/ProductDetailPage'
import { ProductEditPage } from '@/features/products/ProductEditPage'
import { ProductsListPage } from '@/features/products/ProductsListPage'
import { SuppliersPage } from '@/features/suppliers/SuppliersPage'
import { queryClient } from '@/lib/queryClient'
import { ForbiddenPage } from '@/routes/ForbiddenPage'
import { NotFoundPage } from '@/routes/NotFoundPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <SessionWatcher />
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
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
