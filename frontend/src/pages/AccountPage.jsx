import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { addressesApi, authApi } from '../services/api'
import Button from '../components/ui/Button'

export default function AccountPage() {
  const { user, loading, isAuthenticated, logout, updateProfile, isAdmin } = useAuth()
  const { push } = useToast()
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState({ fullName: '', mobile: '' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' })
  const [addrForm, setAddrForm] = useState({
    fullName: '',
    mobile: '',
    pinCode: '',
    state: '',
    city: '',
    house: '',
    street: '',
    landmark: '',
    addressType: 'home',
    isDefault: true,
  })

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName || '', mobile: user.mobile || '' })
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) return
    addressesApi.list().then((d) => setAddresses(d.addresses)).catch(() => {})
  }, [isAuthenticated])

  if (loading) return <div className="p-10"><div className="skeleton mx-auto h-40 max-w-2xl rounded-xl" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: '/account' }} />

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      await updateProfile(form)
      push('Profile updated')
    } catch (err) {
      push(err.message, 'error')
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    try {
      await authApi.changePassword(pwd)
      setPwd({ currentPassword: '', newPassword: '' })
      push('Password updated')
    } catch (err) {
      push(err.message, 'error')
    }
  }

  const addAddress = async (e) => {
    e.preventDefault()
    try {
      const data = await addressesApi.create({ ...addrForm, email: user.email })
      setAddresses((a) => [data.address, ...a])
      push('Address saved')
    } catch (err) {
      push(err.message, 'error')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My account</h1>
          <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Button to="/admin" variant="outline">Admin</Button>}
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
        <Link to="/orders" className="text-accent">Orders</Link>
        <Link to="/wishlist" className="text-accent">Wishlist</Link>
        <Link to="/track" className="text-accent">Track order</Link>
      </div>

      <form onSubmit={saveProfile} className="mt-8 space-y-3 rounded-xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold">Profile</h2>
        <input
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          placeholder="Full name"
        />
        <input
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          placeholder="Mobile"
        />
        <Button type="submit">Save profile</Button>
      </form>

      <form onSubmit={changePassword} className="mt-6 space-y-3 rounded-xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold">Change password</h2>
        <input
          type="password"
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
          placeholder="Current password"
          value={pwd.currentPassword}
          onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
        />
        <input
          type="password"
          className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
          placeholder="New password"
          value={pwd.newPassword}
          onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
        />
        <Button type="submit" variant="outline">Update password</Button>
      </form>

      <section className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold">Saved addresses</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {addresses.map((a) => (
            <li key={a.id} className="flex justify-between gap-3 rounded-lg border border-line p-3">
              <span>
                {a.fullName} · {a.house}, {a.street}, {a.city} {a.pinCode}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-danger"
                onClick={async () => {
                  await addressesApi.remove(a.id)
                  setAddresses((list) => list.filter((x) => x.id !== a.id))
                }}
              >
                Remove
              </button>
            </li>
          ))}
          {!addresses.length && <li className="text-ink-muted">No saved addresses yet.</li>}
        </ul>

        <form onSubmit={addAddress} className="mt-4 grid gap-2 sm:grid-cols-2">
          {['fullName', 'mobile', 'pinCode', 'state', 'city', 'house', 'street', 'landmark'].map((key) => (
            <input
              key={key}
              className="rounded-lg border border-line px-3 py-2 text-sm"
              placeholder={key}
              value={addrForm[key]}
              onChange={(e) => setAddrForm({ ...addrForm, [key]: e.target.value })}
              required={key !== 'landmark'}
            />
          ))}
          <Button type="submit" className="sm:col-span-2">Add address</Button>
        </form>
      </section>
    </div>
  )
}
