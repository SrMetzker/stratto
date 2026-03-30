import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  Package,
  BookOpen,
  BarChart3,
  Warehouse,
  Building2,
  Users,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useEstablishments } from '@/hooks'
import { hasAnyRole, ROUTE_ROLE_MAP, type AppRole } from '@/utils/rbac'

interface NavItem {
  path: string
  icon: React.ReactNode
  label: string
  allowedRoles: readonly AppRole[]
}

const navItems: NavItem[] = [
  { path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', allowedRoles: ROUTE_ROLE_MAP['/dashboard'] },
  { path: '/kitchen', icon: <ChefHat className="w-5 h-5" />, label: 'Kitchen', allowedRoles: ROUTE_ROLE_MAP['/kitchen'] },
  { path: '/tables', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Tables', allowedRoles: ROUTE_ROLE_MAP['/tables'] },
  { path: '/products', icon: <Package className="w-5 h-5" />, label: 'Products', allowedRoles: ROUTE_ROLE_MAP['/products'] },
  { path: '/recipes', icon: <BookOpen className="w-5 h-5" />, label: 'Recipes', allowedRoles: ROUTE_ROLE_MAP['/recipes'] },
  { path: '/inventory', icon: <Warehouse className="w-5 h-5" />, label: 'Inventory', allowedRoles: ROUTE_ROLE_MAP['/inventory'] },
  { path: '/reports', icon: <BarChart3 className="w-5 h-5" />, label: 'Reports', allowedRoles: ROUTE_ROLE_MAP['/reports'] },
  { path: '/establishments', icon: <Building2 className="w-5 h-5" />, label: 'Establishments', allowedRoles: ROUTE_ROLE_MAP['/establishments'] },
  { path: '/users', icon: <Users className="w-5 h-5" />, label: 'Users', allowedRoles: ROUTE_ROLE_MAP['/users'] },
  { path: '/subscription', icon: <CreditCard className="w-5 h-5" />, label: 'Subscription', allowedRoles: ROUTE_ROLE_MAP['/subscription'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout, activeEstablishmentId, setActiveEstablishmentId } = useAuthStore()
  const { data: liveEstablishments } = useEstablishments()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const visibleNavItems = navItems.filter((item) => hasAnyRole(user?.role, item.allowedRoles))
  const establishmentOptions = user?.role === 'admin'
    ? (liveEstablishments ?? []).map((item) => ({
        id: item.id,
        establishmentId: item.id,
        establishment: { name: item.name },
      }))
    : (user?.establishments ?? [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleEstablishmentChange = (establishmentId: string) => {
    setActiveEstablishmentId(establishmentId)
    void queryClient.invalidateQueries()
    void queryClient.refetchQueries({ type: 'active' })
  }

  return (
    <aside
      className={`
        hidden md:flex flex-col
        bg-bg-surface border-r border-bg-border
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[68px]' : 'w-56'}
        min-h-screen sticky top-0 flex-shrink-0
      `}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-bg-border ${collapsed ? 'justify-center' : ''}`}>
        <img
          src="/logo.png"
          alt="Stratto"
          className={`flex-shrink-0 object-contain ${collapsed ? 'w-9 h-9 rounded-xl' : 'w-10 h-10 rounded-xl'}`}
        />
        {!collapsed && (
          <div>
            <p className="font-display font-bold text-white text-lg leading-none">Stratto</p>
            <p className="text-xs text-gray-500 mt-0.5">Controla tu stock sin pérdidas</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl
              transition-all duration-150 active:scale-95
              ${isActive
                ? 'bg-brand-muted text-brand border border-brand/20'
                : 'text-gray-400 hover:text-white hover:bg-bg-elevated'}
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? item.label : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="font-body font-medium text-sm">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 flex flex-col gap-2">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-bg-elevated transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>

        {/* User */}
        {!collapsed && (
          <div className="card px-3 py-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-muted border border-brand/20 flex items-center justify-center text-brand font-display font-bold text-sm flex-shrink-0">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role ?? 'user'}</p>
              </div>
            </div>

            {establishmentOptions.length > 0 && (
              <select
                value={activeEstablishmentId ?? establishmentOptions[0]?.establishmentId ?? ''}
                onChange={(event) => handleEstablishmentChange(event.target.value)}
                className="input-field !py-2 !text-xs"
              >
                {establishmentOptions.map((item) => (
                  <option key={item.id} value={item.establishmentId}>
                    {item.establishment?.name ?? item.establishmentId}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
