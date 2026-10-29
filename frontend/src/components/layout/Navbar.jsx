import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { BRAND, NAV_LINKS } from '../../config/brand'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { count } = useCart()
  const { count: wishCount } = useWishlist()
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const submitSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate(`/catalogue?search=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setOpen(false)
    setQuery('')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-ink hover:text-accent'}`

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-lg p-2 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          {BRAND.name}
        </Link>

        <nav className="ml-6 hidden items-center gap-5 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.path + link.label} to={link.path} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="rounded-lg p-2"
            aria-label="Search products"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link to="/wishlist" className="relative rounded-lg p-2" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </Link>
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className="rounded-lg p-2"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="relative rounded-lg p-2" aria-label={`Shopping cart, ${count} items`}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-line bg-white px-4 py-3 animate-fade-in">
          <form onSubmit={submitSearch} className="mx-auto flex max-w-7xl gap-2">
            <label htmlFor="nav-search" className="sr-only">
              Search sneakers
            </label>
            <input
              id="nav-search"
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, brand, or category"
              className="w-full rounded-lg border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {open && (
        <div className="border-t border-line bg-cream px-4 py-4 lg:hidden animate-fade-in">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path + link.label}
                to={link.path}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Link to="/catalogue" onClick={() => setOpen(false)} className="text-sm font-medium">
              All Products
            </Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="text-sm font-medium text-accent">
                Admin Dashboard
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <span className="text-xs text-ink-muted">Signed in as {user.fullName}</span>
                <button
                  type="button"
                  className="text-left text-sm font-medium"
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium">
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
