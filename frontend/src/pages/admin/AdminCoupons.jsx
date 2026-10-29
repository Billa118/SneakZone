import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'

export default function AdminCoupons() {
  const { push } = useToast()
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percent',
    discountValue: '10',
    minOrderAmount: '999',
  })

  const load = () => {
    adminApi.coupons().then((d) => setCoupons(d.coupons)).catch((e) => push(e.message, 'error'))
  }

  useEffect(() => {
    load()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    try {
      await adminApi.createCoupon({
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        isDemo: true,
      })
      push('Coupon created')
      setForm({ code: '', description: '', discountType: 'percent', discountValue: '10', minOrderAmount: '999' })
      load()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Coupons</h1>
      <form onSubmit={create} className="mt-6 grid gap-3 rounded-xl border border-line bg-white p-5 sm:grid-cols-2">
        <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <select className="rounded-lg border border-line px-3 py-2 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
          <option value="percent">percent</option>
          <option value="fixed">fixed</option>
        </select>
        <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
        <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Min order" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
        <Button type="submit">Create coupon</Button>
      </form>
      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
        {coupons.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold">{c.code}</p>
              <p className="text-ink-muted">
                {c.discountType} {c.discountValue} · min ₹{c.minOrderAmount} · used {c.usedCount}
                {c.isDemo ? ' · demo' : ''}
              </p>
            </div>
            <button
              type="button"
              className="font-semibold text-accent"
              onClick={async () => {
                await adminApi.updateCoupon(c.id, { isActive: !c.isActive })
                load()
              }}
            >
              {c.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
