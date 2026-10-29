import { useEffect, useState } from 'react'
import { formatINR } from '../../config/brand'
import { adminApi } from '../../services/api'
import { useToast } from '../../context/ToastContext'

const STATUSES = [
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

export default function AdminOrders() {
  const { push } = useToast()
  const [orders, setOrders] = useState([])
  const [q, setQ] = useState('')

  const load = (query = q) => {
    adminApi
      .orders(query ? { q: query } : {})
      .then((d) => setOrders(d.orders))
      .catch((err) => push(err.message, 'error'))
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await adminApi.updateOrderStatus(id, status)
      push('Status updated')
      load()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          load(q)
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ref, email, mobile, name"
          className="w-full max-w-md rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
          Search
        </button>
      </form>
      <ul className="mt-6 space-y-3">
        {orders.map((o) => (
          <li key={o.id} className="rounded-xl border border-line bg-white p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{o.orderRef}</p>
                <p className="text-ink-muted">
                  {o.fullName} · {o.email} · {o.mobile}
                </p>
                <p className="text-ink-muted">
                  {formatINR(o.total)} · {o.paymentMethod} · {o.paymentStatus}
                  {o.isDemoOrder ? ' · demo' : ''}
                </p>
              </div>
              <label className="text-xs">
                Status
                <select
                  className="ml-2 rounded-lg border border-line px-2 py-1.5"
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </li>
        ))}
        {!orders.length && <li className="text-ink-muted">No orders found.</li>}
      </ul>
    </div>
  )
}
