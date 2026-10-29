import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, Minus, Plus } from 'lucide-react'
import { productsApi, reviewsApi } from '../services/api'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import PriceDisplay from '../components/ui/PriceDisplay'
import ProductImage from '../components/ui/ProductImage'
import StarRating from '../components/ui/StarRating'
import Button from '../components/ui/Button'
import ProductGrid from '../components/product/ProductGrid'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, replaceWithBuyNow } = useCart()
  const { has, toggle } = useWishlist()
  const { push } = useToast()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [pin, setPin] = useState('')
  const [pinResult, setPinResult] = useState(null)
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setSize('')
    setQty(1)
    ;(async () => {
      try {
        const data = await productsApi.detail(id)
        if (cancelled) return
        setProduct(data.product)
        setColor(data.product.colors?.[0] || '')
        setActiveImage(0)
        const [rel, rev] = await Promise.all([
          productsApi.related(id),
          reviewsApi.product(id),
        ])
        if (cancelled) return
        setRelated(rel.products)
        setReviews(rev.reviews)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Product not found')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const variants = product?.variants || []
  const sizesForColor = useMemo(() => {
    const map = new Map()
    variants
      .filter((v) => !color || v.color === color)
      .forEach((v) => {
        if (!map.has(v.size) || v.stock > map.get(v.size).stock) map.set(v.size, v)
      })
    return [...map.values()].sort((a, b) => Number(a.size) - Number(b.size))
  }, [variants, color])

  const selectedVariant = useMemo(
    () => variants.find((v) => v.size === size && v.color === color),
    [variants, size, color]
  )

  const buildCartItem = () => {
    if (!selectedVariant) return null
    return {
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      brand: product.brand,
      size: selectedVariant.size,
      color: selectedVariant.color,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity: qty,
      maxStock: selectedVariant.stock,
    }
  }

  const requireSize = () => {
    if (!size || !selectedVariant) {
      push('Please select an available size', 'error')
      return false
    }
    if (selectedVariant.stock < qty) {
      push('Not enough stock for that quantity', 'error')
      return false
    }
    return true
  }

  const onAdd = () => {
    if (!requireSize()) return
    addItem(buildCartItem())
    push('Added to cart')
  }

  const onBuy = () => {
    if (!requireSize()) return
    replaceWithBuyNow(buildCartItem())
    navigate('/checkout')
  }

  const checkPin = async (e) => {
    e.preventDefault()
    setPinError('')
    setPinResult(null)
    try {
      const data = await productsApi.deliveryEstimate(pin)
      setPinResult(data)
    } catch (err) {
      setPinError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/3 rounded" />
            <div className="skeleton h-10 w-2/3 rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Product unavailable</h1>
        <p className="mt-2 text-ink-muted">{error || 'This product could not be found.'}</p>
        <Button to="/catalogue" className="mt-6">
          Back to catalogue
        </Button>
      </div>
    )
  }

  const images =
    product.images?.length > 0
      ? product.images
      : [{ url: product.imageUrl, alt: product.name }]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="text-xs text-ink-muted">
        <Link to="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to="/catalogue" className="hover:text-ink">
          Catalogue
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <ProductImage
              src={images[activeImage]?.url}
              alt={images[activeImage]?.alt || product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id || i}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                  i === activeImage ? 'border-accent' : 'border-transparent'
                }`}
              >
                <ProductImage src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-ink-muted">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{product.name}</h1>
          {product.isDemo && (
            <p className="mt-2 text-xs text-ink-muted">Sample demo product — not authentic branded merchandise.</p>
          )}
          <div className="mt-3">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              discountPercent={product.discountPercent}
              size="lg"
            />
          </div>
          <div className="mt-2">
            <StarRating rating={product.rating} count={product.reviewCount} note={product.ratingNote} />
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink-muted">{product.description}</p>

          {product.colors?.length > 0 && (
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold">Color: {color}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setColor(c)
                      setSize('')
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      color === c ? 'border-ink bg-ink text-white' : 'border-line bg-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Size (UK)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizesForColor.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  disabled={!v.available}
                  onClick={() => setSize(v.size)}
                  className={`min-w-11 rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                    size === v.size ? 'border-ink bg-ink text-white' : 'border-line bg-white'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="mt-2 text-xs text-ink-muted">
                {selectedVariant.stock > 0
                  ? `${selectedVariant.stock} in stock`
                  : 'Out of stock'}
              </p>
            )}
          </fieldset>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-semibold">Qty</span>
            <div className="inline-flex items-center rounded-lg border border-line">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="p-2"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="p-2"
                onClick={() =>
                  setQty((q) => Math.min(selectedVariant?.stock || 99, q + 1))
                }
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={onAdd}>Add to Cart</Button>
            <Button variant="secondary" onClick={onBuy}>
              Buy Now
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const added = await toggle(product.id)
                push(added ? 'Added to wishlist' : 'Removed from wishlist')
              }}
              aria-label="Add to wishlist"
            >
              <Heart className={`h-4 w-4 ${has(product.id) ? 'fill-accent text-accent' : ''}`} />
              Wishlist
            </Button>
          </div>

          <form onSubmit={checkPin} className="mt-8 rounded-xl border border-line bg-white p-4">
            <label htmlFor="pin" className="text-sm font-semibold">
              Check delivery estimate
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="6-digit PIN"
                maxLength={6}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              />
              <Button type="submit" variant="outline">
                Check
              </Button>
            </div>
            {pinError && <p className="mt-2 text-xs text-danger">{pinError}</p>}
            {pinResult && (
              <p className="mt-2 text-xs text-ink-muted">
                Estimated in {pinResult.estimatedDays} days ({pinResult.estimatedDate}). {pinResult.note}
              </p>
            )}
          </form>

          <div className="mt-6 space-y-2 text-sm text-ink-muted">
            <p><strong className="text-ink">Shipping:</strong> Standard and express options at checkout (estimates).</p>
            <p><strong className="text-ink">Exchange:</strong> Size exchanges subject to stock and returns policy.</p>
            <p><strong className="text-ink">Returns:</strong> See Returns & Refunds for eligibility windows.</p>
            {product.material && <p><strong className="text-ink">Material:</strong> {product.material}</p>}
            {product.specifications && <p><strong className="text-ink">Specs:</strong> {product.specifications}</p>}
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-xl font-bold">Reviews</h2>
        <p className="mt-1 text-xs text-ink-muted">Demo reviews are labeled as sample content.</p>
        <div className="mt-4 space-y-3">
          {reviews.length === 0 && <p className="text-sm text-ink-muted">No reviews yet.</p>}
          {reviews.map((r) => (
            <article key={r.id} className="rounded-xl border border-line bg-white p-4">
              <StarRating rating={r.rating} />
              <h3 className="mt-2 text-sm font-semibold">{r.title || r.authorName}</h3>
              <p className="mt-1 text-sm text-ink-muted">{r.body}</p>
              {r.demoLabel && <p className="mt-2 text-xs text-ink-muted">{r.demoLabel}</p>}
            </article>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-xl font-bold">Related products</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
