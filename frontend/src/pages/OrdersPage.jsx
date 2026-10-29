import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductImage from '../components/ui/ProductImage'
import { useAuth } from '../context/AuthContext'
import { ordersApi } from '../services/api'
import Button from '../components/ui/Button'

const formatDate = (value) => {
  if (!value) return 'Date to be confirmed'
  const date = new Date(value)
  const day = date.getDate()
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th'
  return `${day}${suffix} ${date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`
}

const formatAmount = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount ?? 0)

const formatStatus = (status) =>
  (status || 'processing')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    ordersApi
      .mine()
      .then((d) => setOrders(d.orders))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [isAuthenticated, authLoading])

  if (authLoading || loading) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><div className="skeleton h-32 rounded-xl" /></div>
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in to view orders</h1>
        <Button to="/login" className="mt-6">
          Login
        </Button>
        <p className="mt-4 text-sm text-ink-muted">
          Or <Link to="/track" className="text-accent underline">track a guest order</Link> with your reference.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Your account</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Your orders</h1>
      <p className="mt-2 text-ink-muted">Hey {user?.fullName?.split(' ')[0] || 'there'} 👋 Your order updates are all in one place.</p>
      {error && <p className="mt-4 text-danger">{error}</p>}
      {!orders.length && !error && (
        <p className="mt-6 text-ink-muted">No orders yet.</p>
      )}
      <ul className="mt-6 space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cream/60 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Order ID</p>
                <p className="mt-1 font-semibold">{o.orderRef}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                {formatStatus(o.status)}
              </span>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row">
                {o.items?.[0] && (
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-cream">
                    <ProductImage
                      src={o.items[0].imageUrl}
                      alt={`${o.items[0].color} ${o.items[0].productName}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {o.items?.map((item) => (
                    <div key={item.id}>
                      <p className="font-display text-lg font-bold">{item.productName}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {item.brand} · {item.color} · Size {item.size} · Qty {item.quantity}
                      </p>
                      <p className="mt-3 text-lg font-bold">{formatAmount(o.total)}</p>
                    </div>
                  ))}
                  <p className="mt-4 text-sm">
                    <span className="font-semibold">Payment:</span> Cash on Delivery (COD)
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {o.deliveryMethodLabel || 'Standard Delivery'} · Deliver by {formatDate(o.estimatedDelivery)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink">
                    Your {o.items?.[0]?.brand || 'store'} order is {formatStatus(o.status)} and will be delivered by {formatDate(o.estimatedDelivery)}.
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">Ordered on {formatDate(o.createdAt)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                {o.status === 'packed' ? (
                  <p className="text-sm text-ink-muted">Your order is packed and getting ready to ship.</p>
                ) : <span />}
                <Link
                  to={`/track/${o.orderRef}`}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
                >
                  Track order
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
