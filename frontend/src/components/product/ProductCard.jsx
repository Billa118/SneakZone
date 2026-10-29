import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../../context/WishlistContext'
import { useToast } from '../../context/ToastContext'
import PriceDisplay from '../ui/PriceDisplay'
import ProductImage from '../ui/ProductImage'
import StarRating from '../ui/StarRating'

export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist()
  const { push } = useToast()
  const wished = has(product.id)

  const onWish = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const added = await toggle(product.id)
    push(added ? 'Added to wishlist' : 'Removed from wishlist')
  }

  return (
    <article className="group relative flex flex-col">
      <Link to={`/product/${product.id}`} className="block overflow-hidden rounded-xl border border-line bg-white">
        <div className="relative aspect-square overflow-hidden bg-cream">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {product.discountPercent > 0 && (
            <span className="absolute left-3 top-3 rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">
              -{product.discountPercent}%
            </span>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={onWish}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white"
      >
        <Heart
          className={`h-4 w-4 ${wished ? 'fill-accent text-accent' : 'text-ink'}`}
        />
      </button>

      <div className="mt-3 flex flex-1 flex-col gap-1.5 px-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{product.brand}</p>
        <Link to={`/product/${product.id}`} className="line-clamp-2 text-sm font-semibold text-ink hover:underline">
          {product.name}
        </Link>
        <PriceDisplay
          price={product.price}
          originalPrice={product.originalPrice}
          discountPercent={product.discountPercent}
          size="sm"
        />
        <StarRating rating={product.rating} count={product.reviewCount} />
        {product.colors?.length > 0 && (
          <div className="mt-1 flex gap-1.5" aria-label="Available colors">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c}
                title={c}
                className="h-3 w-3 rounded-full border border-line"
                style={{ backgroundColor: colorToCss(c) }}
              />
            ))}
          </div>
        )}
        <Link
          to={`/product/${product.id}`}
          className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-ink underline-offset-2 hover:underline"
        >
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
          View details
        </Link>
      </div>
    </article>
  )
}

function colorToCss(name) {
  const map = {
    black: '#111',
    white: '#f5f5f5',
    red: '#dc2626',
    navy: '#1e3a5f',
    grey: '#9ca3af',
    gray: '#9ca3af',
    cream: '#f5f0e6',
    blush: '#f9c5d1',
    orange: '#ea580c',
    blue: '#2563eb',
    yellow: '#eab308',
    green: '#16a34a',
    lilac: '#c4b5fd',
    mint: '#6ee7b7',
    pink: '#ec4899',
    teal: '#14b8a6',
    beige: '#d6c6a8',
  }
  return map[name.toLowerCase()] || '#d4d4d4'
}
