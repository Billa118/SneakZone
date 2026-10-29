import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { productsApi } from '../services/api'
import ProductGrid from '../components/product/ProductGrid'
import Button from '../components/ui/Button'

export default function WishlistPage() {
  const { productIds, toggle } = useWishlist()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      if (!productIds.length) {
        setProducts([])
        setLoading(false)
        return
      }
      try {
        const results = await Promise.all(
          productIds.map((id) => productsApi.detail(id).then((d) => d.product).catch(() => null))
        )
        if (!cancelled) setProducts(results.filter(Boolean))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productIds])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Wishlist</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Guest wishlist is stored locally. Signed-in users sync with the server.
      </p>
      {loading && <div className="mt-8 skeleton h-40 rounded-xl" />}
      {!loading && !products.length && (
        <div className="mt-10 text-center">
          <p className="text-ink-muted">Your wishlist is empty.</p>
          <Button to="/catalogue" className="mt-4">Browse sneakers</Button>
        </div>
      )}
      {!loading && products.length > 0 && (
        <div className="mt-8">
          <ProductGrid products={products} />
          <p className="mt-6 text-sm text-ink-muted">
            Open a product to select a size, then add to cart.{' '}
            <button
              type="button"
              className="font-semibold text-accent"
              onClick={() => products.forEach((p) => toggle(p.id))}
            >
              Clear wishlist
            </button>
          </p>
          <Link to="/catalogue" className="mt-2 inline-block text-sm font-semibold text-ink underline">
            Continue shopping
          </Link>
        </div>
      )}
    </div>
  )
}
