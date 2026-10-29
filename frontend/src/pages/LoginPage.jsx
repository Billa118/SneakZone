import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import { BRAND } from '../config/brand'

export default function LoginPage() {
  const { login } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const user = await login(data.email, data.password)
      push('Welcome back')
      const dest = location.state?.from || (user.role === 'admin' ? '/admin' : '/account')
      navigate(dest)
    } catch (err) {
      push(err.message || 'Login failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Login</h1>
      <p className="mt-2 text-sm text-ink-muted">Sign in to {BRAND.name}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="font-semibold">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <span className="text-xs text-danger">{errors.email.message}</span>}
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5"
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <span className="text-xs text-danger">{errors.password.message}</span>}
        </label>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        New here? <Link to="/register" className="font-semibold text-accent">Create an account</Link>
      </p>
      <p className="mt-6 rounded-lg bg-cream-dark/60 p-3 text-xs text-ink-muted">
        Demo customer: customer@sneakzone.local / Customer123!<br />
        Admin credentials are set in backend <code>.env</code> (never use defaults in production).
      </p>
    </div>
  )
}
