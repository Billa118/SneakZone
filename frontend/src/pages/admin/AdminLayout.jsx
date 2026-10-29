import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BRAND } from '../../config/brand'

const links = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/coupons', label: 'Coupons' },
]

export default function AdminLayout() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return <div className="p-10"><div className="skeleton mx-auto h-40 max-w-5xl rounded-xl" /></div>
  }
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: '/admin' }} />
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-ink-muted">This area is protected by server-side authorization.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-display text-lg font-bold">{BRAND.name} Admin</p>
            <p className="text-xs text-ink-muted">Protected management console</p>
          </div>
          <NavLink to="/" className="text-sm font-semibold text-accent">
            View storefront
          </NavLink>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-3 text-sm font-semibold">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </div>
    </div>
  )
}
