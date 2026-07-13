import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { ToastContainer } from '@/components/ui/Toast'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { KitchenPage } from '@/pages/KitchenPage'
import { TablesPage } from '@/pages/TablesPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { RecipesPage } from '@/pages/RecipesPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { EstablishmentsPage } from '@/pages/EstablishmentsPage'
import { UsersPage } from '@/pages/UsersPage'
import { SubscriptionPage } from '@/pages/SubscriptionPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { useAuthStore } from '@/store/authStore'
import { getDefaultRouteForRole, ROUTE_ROLE_MAP } from '@/utils/rbac'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route
              path="/dashboard"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/dashboard']}>
                  <DashboardPage />
                </RoleGuard>
              }
            />
            <Route
              path="/kitchen"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/kitchen']}>
                  <KitchenPage />
                </RoleGuard>
              }
            />
            <Route
              path="/tables"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/tables']}>
                  <TablesPage />
                </RoleGuard>
              }
            />
            <Route
              path="/products"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/products']}>
                  <ProductsPage />
                </RoleGuard>
              }
            />
            <Route
              path="/recipes"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/recipes']}>
                  <RecipesPage />
                </RoleGuard>
              }
            />
            <Route
              path="/inventory"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/inventory']}>
                  <InventoryPage />
                </RoleGuard>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/reports']}>
                  <ReportsPage />
                </RoleGuard>
              }
            />
            <Route
              path="/establishments"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/establishments']}>
                  <EstablishmentsPage />
                </RoleGuard>
              }
            />
            <Route
              path="/users"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/users']}>
                  <UsersPage />
                </RoleGuard>
              }
            />
            <Route
              path="/subscription"
              element={
                <RoleGuard allowedRoles={ROUTE_ROLE_MAP['/subscription']}>
                  <SubscriptionPage />
                </RoleGuard>
              }
            />
          </Route>
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  return <Navigate to={isAuthenticated ? getDefaultRouteForRole(user?.role) : '/login'} replace />
}
