import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { formatINR } from '../config/brand'
import { ordersApi } from '../services/api'
import Button from '../components/ui/Button'
import ProductImage from '../components/ui/ProductImage'

export default function OrderConfirmationPage() {
  const { orderRef } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(location.state?.order || null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (order) return
    ordersApi
      .track(orderRef)
      .then((d) => setOrder(d.order))
      .catch((err) => setError(err.message))
  }, [orderRef, order])

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-ink-muted">{error}</p>
        <Button to="/" className="mt-6">
          Home
        </Button>
      </div>
    )
  }

  if (!order) {
    return <div className="mx-auto max-w-7xl px-4 py-16"><div className="skeleton h-40 rounded-xl" /></div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
        <h1 className="mt-4 font-display text-3xl font-bold">Order confirmed</h1>
        <p className="mt-2 text-ink-muted">
          Reference <strong className="text-ink">{order.orderRef}</strong>
        </p>
        {order.isDemoOrder && (
          <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
            Demo order — {order.paymentNote}
          </p>
        )}
      </div>

      <div className="mt-10 rounded-xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-bold">Items</h2>
        <ul className="mt-4 space-y-3">
          {order.items?.map((item) => (
            <li key={item.id} className="flex gap-3 text-sm">
              <div className="h-14 w-14 overflow-hidden rounded-md bg-cream">
                <ProductImage src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-ink-muted">
                  {item.brand} · {item.size} / {item.color} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold">{formatINR(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-bold">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 text-sm">
          <h3 className="font-display font-bold">Delivery address</h3>
          <p className="mt-2">{order.fullName}</p>
          <p className="text-ink-muted">
            {order.address?.house}, {order.address?.street}
            <br />
            {order.address?.city}, {order.address?.state} {order.address?.pinCode}
          </p>
          {order.estimatedDelivery && (
            <p className="mt-3 text-xs text-ink-muted">
              Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')} (estimate)
            </p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-white p-5 text-sm">
          <h3 className="font-display font-bold">Tracking</h3>
          <ol className="mt-3 space-y-2">
            {order.timeline?.map((step) => (
              <li key={step.key} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    step.completed ? 'bg-accent' : 'bg-line'
                  }`}
                />
                <span className={step.current ? 'font-semibold' : 'text-ink-muted'}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to={`/track/${order.orderRef}`}>Track order</Button>
        <Button to="/orders" variant="outline">
          My orders
        </Button>
        <Link to="/catalogue" className="text-sm font-semibold text-accent underline-offset-2 hover:underline self-center">
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
