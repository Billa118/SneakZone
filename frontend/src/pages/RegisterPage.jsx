import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        mobile: data.mobile || undefined,
      })
      push('Account created')
      navigate('/account')
    } catch (err) {
      push(err.message || 'Registration failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Create account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="font-semibold">Full name</span>
          <input className="mt-1 w-full rounded-lg border border-line px-3 py-2.5" {...register('fullName', { required: 'Required' })} />
          {errors.fullName && <span className="text-xs text-danger">{errors.fullName.message}</span>}
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Email</span>
          <input type="email" className="mt-1 w-full rounded-lg border border-line px-3 py-2.5" {...register('email', { required: 'Required' })} />
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Mobile (optional)</span>
          <input
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5"
            {...register('mobile', {
              pattern: { value: /^$|^[6-9]\d{9}$/, message: 'Invalid mobile' },
            })}
          />
          {errors.mobile && <span className="text-xs text-danger">{errors.mobile.message}</span>}
        </label>
        <label className="block text-sm">
          <span className="font-semibold">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2.5"
            {...register('password', {
              required: 'Required',
              minLength: { value: 8, message: 'At least 8 characters' },
            })}
          />
          {errors.password && <span className="text-xs text-danger">{errors.password.message}</span>}
        </label>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating…' : 'Register'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-ink-muted">
        Already have an account? <Link to="/login" className="font-semibold text-accent">Login</Link>
      </p>
    </div>
  )
}
