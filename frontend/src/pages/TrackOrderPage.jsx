import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatINR } from '../config/brand'
import { ordersApi } from '../services/api'
import Button from '../components/ui/Button'
import ProductImage from '../components/ui/ProductImage'

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Not available'

export default function TrackOrderPage() {
  const { orderRef: paramRef } = useParams()
  const [ref, setRef] = useState(paramRef || '')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (e) => {
    e?.preventDefault()
    if (!ref.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await ordersApi.track(ref.trim(), email.trim() || undefined)
      setOrder(data.order)
    } catch (err) {
      setOrder(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paramRef) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramRef])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Track order</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Enter your order reference. Demo orders are labeled clearly and statuses are not live courier data.
      </p>
      <div className="mt-4 rounded-xl border border-accent/20 bg-cream p-4 text-sm">
        <p className="font-semibold">Sample delivery in progress</p>
        <p className="mt-1 text-ink-muted">
          Rush Shoes Kl · Black · COD · Open Box Delivery · Expected 31 October 2026
        </p>
        <Link
          to="/track/1730900772"
          className="mt-2 inline-block font-semibold text-accent underline underline-offset-2"
        >
          View sample tracking
        </Link>
      </div>

      <form onSubmit={load} className="mt-6 space-y-3 rounded-xl border border-line bg-white p-5">
        <label className="block text-sm">
          <span className="font-semibold">Order reference</span>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
            placeholder="SZ-YYYYMMDD-XXXXXX"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Email (if required)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
            placeholder="Order email"
          />
        </label>
        <Button type="submit" disabled={loading}>
          {loading ? 'Looking up…' : 'Track'}
        </Button>
      </form>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {order && (
        <div className="mt-8 rounded-xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-ink-muted">Order</p>
              <p className="font-display text-xl font-bold">{order.orderRef}</p>
            </div>
            <p className="font-semibold">{formatINR(order.total)}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-cream p-3">
              <p className="text-xs text-ink-muted">Order date</p>
              <p className="mt-1 text-sm font-semibold">{formatDate(order.createdAt)}</p>
            </div>
            <div className="rounded-lg bg-cream p-3">
              <p className="text-xs text-ink-muted">{order.estimatedDeliveryNote || 'Expected delivery'}</p>
              <p className="mt-1 text-sm font-semibold">{formatDate(order.estimatedDelivery)}</p>
            </div>
            <div className="rounded-lg border border-line p-3">
              <p className="text-xs text-ink-muted">Delivery service</p>
              <p className="mt-1 text-sm font-bold uppercase">
                {order.deliveryMethodLabel || order.deliveryMethod}
              </p>
            </div>
            <div className="rounded-lg border border-line p-3">
              <p className="text-xs text-ink-muted">Payment</p>
              <p className="mt-1 text-sm font-semibold">
                {order.paymentMethodLabel || order.paymentMethod?.toUpperCase()}
              </p>
              {order.paymentMethod === 'cod' && (
                <p className="mt-1 text-xs text-ink-muted">Due at delivery: {formatINR(order.total)}</p>
              )}
            </div>
          </div>
          {order.items?.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <h2 className="text-sm font-bold">Items in this delivery</h2>
              <ul className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-md bg-cream">
                      <ProductImage src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-ink-muted">
                        {item.brand} · Size {item.size} · {item.color} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatINR(item.lineTotal)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {order.address && (
            <p className="mt-4 text-xs text-ink-muted">
              Delivering to {order.address.house}, {order.address.street}, {order.address.city}, {order.address.state} {order.address.pinCode}
            </p>
          )}
          <ol className="mt-6 space-y-4">
            {order.timeline?.map((step) => (
              <li key={step.key} className="flex gap-3">
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                    step.current ? 'bg-accent ring-4 ring-accent/20' : step.completed ? 'bg-ink' : 'bg-line'
                  }`}
                />
                <div>
                  <p className={`text-sm ${step.current ? 'font-bold' : 'font-medium'}`}>{step.label}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
