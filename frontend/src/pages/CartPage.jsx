import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatINR } from '../config/brand'
import { useCart } from '../context/CartContext'
import { couponsApi, configApi, ordersApi } from '../services/api'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import ProductImage from '../components/ui/ProductImage'

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, coupon, setCoupon } = useCart()
  const { push } = useToast()
  const [code, setCode] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(99)
  const [threshold, setThreshold] = useState(2999)
  const [serverQuote, setServerQuote] = useState(null)

  useEffect(() => {
    configApi.public().then((c) => {
      setThreshold(c.freeDeliveryThreshold)
      setDeliveryFee(c.standardDeliveryFee)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!items.length) {
      setServerQuote(null)
      return
    }
    ordersApi
      .quote({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        couponCode: coupon?.code,
        deliveryMethod: 'standard',
      })
      .then(setServerQuote)
      .catch(() => setServerQuote(null))
  }, [items, coupon])

  const applyCoupon = async (e) => {
    e.preventDefault()
    try {
      const data = await couponsApi.validate(code, subtotal)
      setCoupon({ code: data.code, discount: data.discount, description: data.description })
      push('Coupon applied (demo)')
      setCode('')
    } catch (err) {
      push(err.message, 'error')
    }
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink-muted">Browse the collection and add a pair you love.</p>
        <Button to="/catalogue" className="mt-6">
          Continue Shopping
        </Button>
      </div>
    )
  }

  const fee =
    serverQuote?.deliveryFee ??
    (subtotal >= threshold ? 0 : deliveryFee)
  const couponDiscount = serverQuote?.couponDiscount ?? coupon?.discount ?? 0
  const total = serverQuote?.total ?? Math.max(0, subtotal - couponDiscount + fee)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Shopping cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.variantId}
              className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4 sm:flex-row"
            >
              <Link to={`/product/${item.productId}`} className="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-cream">
                <ProductImage src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-ink-muted">{item.brand}</p>
                    <Link to={`/product/${item.productId}`} className="font-semibold hover:underline">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-muted">
                      Size {item.size} · {item.color}
                    </p>
                  </div>
                  <p className="font-semibold">{formatINR(item.unitPrice)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-lg border border-line">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="p-2"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="p-2"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeItem(item.variantId)}
                      className="rounded-lg p-2 text-ink-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-line bg-white p-5">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatINR(serverQuote?.subtotal ?? subtotal)}</dd>
            </div>
            {(serverQuote?.productDiscount || 0) > 0 && (
              <div className="flex justify-between text-ink-muted">
                <dt>Product discount</dt>
                <dd>-{formatINR(serverQuote.productDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{fee === 0 ? 'Free' : formatINR(fee)}</dd>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-accent">
                <dt>Coupon ({coupon?.code})</dt>
                <dd>-{formatINR(couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatINR(total)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-ink-muted">
            Final totals are recalculated on the server at checkout.
          </p>

          <form onSubmit={applyCoupon} className="mt-4 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Coupon code"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              aria-label="Coupon code"
            />
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
          {coupon && (
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-accent"
              onClick={() => setCoupon(null)}
            >
              Remove coupon
            </button>
          )}
          <p className="mt-2 text-xs text-ink-muted">Try demo codes: SNEAK10, FLAT300, WELCOME50</p>

          <Button to="/checkout" className="mt-5 w-full">
            Proceed to Checkout
          </Button>
        </aside>
      </div>
    </div>
  )
}
