import { useEffect, useState } from 'react'
import { formatINR } from '../../config/brand'
import { adminApi } from '../../services/api'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="text-danger">{error}</p>
  if (!data) return <div className="skeleton h-40 rounded-xl" />

  const cards = [
    { label: 'Orders', value: data.stats.orders },
    { label: 'Products', value: data.stats.products },
    { label: 'Customers', value: data.stats.customers },
    { label: 'Revenue', value: formatINR(data.stats.revenue) },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">{data.note}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 font-display text-lg font-bold">Recent orders</h2>
      <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
        {data.recentOrders.map((o) => (
          <li key={o.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
            <span>{o.orderRef}</span>
            <span className="text-ink-muted">{o.status}</span>
            <span className="font-semibold">{formatINR(o.total)}</span>
          </li>
        ))}
        {!data.recentOrders.length && (
          <li className="px-4 py-6 text-sm text-ink-muted">No orders yet.</li>
        )}
      </ul>
    </div>
  )
}
