import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { formatINR } from '../config/brand'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ordersApi } from '../services/api'
import Button from '../components/ui/Button'
import ProductImage from '../components/ui/ProductImage'

export default function CheckoutPage() {
  const { items, coupon, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)
  const [deliveryMethod, setDeliveryMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [submitting, setSubmitting] = useState(false)
  const [options, setOptions] = useState([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      mobile: user?.mobile || '',
      email: user?.email || '',
      pinCode: '',
      state: '',
      city: '',
      house: '',
      street: '',
      landmark: '',
      addressType: 'home',
    },
  })

  const pin = watch('pinCode')

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName || '')
      setValue('mobile', user.mobile || '')
      setValue('email', user.email || '')
    }
  }, [user, setValue])

  useEffect(() => {
    if (!items.length) return
    ordersApi
      .quote({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: coupon?.code,
        deliveryMethod,
      })
      .then(setQuote)
      .catch((err) => push(err.message, 'error'))
  }, [items, coupon, deliveryMethod, push])

  useEffect(() => {
    if (pin && /^\d{6}$/.test(pin)) {
      ordersApi.deliveryOptions(pin).then((d) => setOptions(d.options)).catch(() => {})
    } else {
      ordersApi.deliveryOptions().then((d) => setOptions(d.options)).catch(() => {})
    }
  }, [pin])

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Nothing to checkout</h1>
        <Button to="/catalogue" className="mt-6">
          Shop sneakers
        </Button>
      </div>
    )
  }

  const onSubmit = async (data) => {
    if (submitting) return
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        deliveryMethod,
        paymentMethod,
        couponCode: coupon?.code,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      }
      const result = await ordersApi.create(payload)
      clearCart()
      push(
        result.order.isDemoOrder
          ? 'Demo order placed — no real payment processed'
          : 'Order placed'
      )
      navigate(`/order-confirmation/${result.order.orderRef}`, {
        state: { order: result.order },
      })
    } catch (err) {
      push(err.message || 'Checkout failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>
      {!isAuthenticated && (
        <p className="mt-2 text-sm text-ink-muted">
          Checking out as guest. <a href="/login" className="font-semibold text-accent">Login</a> to save orders to your account.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-bold">Delivery details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName?.message}>
                <input
                  className={inputCls}
                  {...register('fullName', { required: 'Full name is required' })}
                />
              </Field>
              <Field label="Mobile" error={errors.mobile?.message}>
                <input
                  className={inputCls}
                  {...register('mobile', {
                    required: 'Mobile is required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile' },
                  })}
                />
              </Field>
              <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
                <input
                  type="email"
                  className={inputCls}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                />
              </Field>
              <Field label="PIN code" error={errors.pinCode?.message}>
                <input
                  className={inputCls}
                  {...register('pinCode', {
                    required: 'PIN code is required',
                    pattern: { value: /^[1-9][0-9]{5}$/, message: 'Enter a valid 6-digit PIN' },
                  })}
                />
              </Field>
              <Field label="State" error={errors.state?.message}>
                <input className={inputCls} {...register('state', { required: 'State is required' })} />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <input className={inputCls} {...register('city', { required: 'City is required' })} />
              </Field>
              <Field label="House / building" error={errors.house?.message}>
                <input className={inputCls} {...register('house', { required: 'House/building is required' })} />
              </Field>
              <Field label="Street address" error={errors.street?.message} className="sm:col-span-2">
                <input className={inputCls} {...register('street', { required: 'Street is required' })} />
              </Field>
              <Field label="Landmark (optional)">
                <input className={inputCls} {...register('landmark')} />
              </Field>
              <Field label="Address type">
                <select className={inputCls} {...register('addressType')}>
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-bold">Delivery method</h2>
            <p className="mt-1 text-xs text-ink-muted">Estimates use demo rules — not live courier ETAs.</p>
            <div className="mt-4 space-y-2">
              {(options.length ? options : [
                { id: 'standard', name: 'Standard Delivery', fee: 99, estimatedDays: 5, note: 'Estimated' },
              ]).map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 ${
                    deliveryMethod === opt.id ? 'border-accent bg-cream' : 'border-line'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryMethod === opt.id}
                      onChange={() => setDeliveryMethod(opt.id)}
                    />
                    <span>
                      <span className="block text-sm font-semibold">{opt.name}</span>
                      <span className="text-xs text-ink-muted">
                        Est. {opt.estimatedDays} days · {opt.note}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold">
                    {opt.fee === 0 ? 'Free' : formatINR(opt.fee)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-bold">Payment method</h2>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Demo payment mode: we do not collect card numbers, CVVs, or UPI PINs. No real payment is charged.
            </div>
            <div className="mt-4 space-y-2">
              {[
                { id: 'upi', label: 'UPI (demo)' },
                { id: 'card', label: 'Credit / debit card (demo)' },
                { id: 'cod', label: 'Cash on Delivery' },
              ].map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                    paymentMethod === p.id ? 'border-accent bg-cream' : 'border-line'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === p.id}
                    onChange={() => setPaymentMethod(p.id)}
                  />
                  <span className="text-sm font-medium">{p.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-md bg-cream">
                  <ProductImage src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-ink-muted">
                    {item.size} / {item.color} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatINR(item.unitPrice * item.quantity)}</p>
              </li>
            ))}
          </ul>
          {quote && (
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(quote.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{quote.deliveryFee === 0 ? 'Free' : formatINR(quote.deliveryFee)}</dd>
              </div>
              {quote.couponDiscount > 0 && (
                <div className="flex justify-between text-accent">
                  <dt>Coupon</dt>
                  <dd>-{formatINR(quote.couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd>{formatINR(quote.total)}</dd>
              </div>
            </dl>
          )}
          <Button type="submit" className="mt-5 w-full" disabled={submitting}>
            {submitting ? 'Placing order…' : 'Place demo order'}
          </Button>
        </aside>
      </form>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-accent'

function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
      {error && (
        <span className="block text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
