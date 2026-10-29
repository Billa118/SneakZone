import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, RefreshCcw, Headphones, Truck } from 'lucide-react'
import { BRAND } from '../config/brand'
import { productsApi, reviewsApi } from '../services/api'
import ProductGrid from '../components/product/ProductGrid'
import Button from '../components/ui/Button'
import ProductImage from '../components/ui/ProductImage'
import StarRating from '../components/ui/StarRating'

const HERO_IMG =
  'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1400&q=80'

const CATEGORIES = [
  { name: 'Men', slug: 'men', param: 'gender=men', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80' },
  { name: 'Women', slug: 'women', param: 'gender=women', image: 'https://images.unsplash.com/photo-1515957654101-5ca3d0c9e2d4?w=600&q=80' },
  { name: 'Kids', slug: 'kids', param: 'gender=kids', image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600&q=80' },
  { name: 'Running', slug: 'running', param: 'category=running', image: 'https://images.unsplash.com/photo-1542291026-7eec480c2dd7?w=600&q=80' },
  { name: 'Sports', slug: 'sports', param: 'category=sports', image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&q=80' },
  { name: 'Lifestyle', slug: 'lifestyle', param: 'category=lifestyle', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&q=80' },
]

export default function HomePage() {
  const [trending, setTrending] = useState([])
  const [arrivals, setArrivals] = useState([])
  const [bestsellers, setBestsellers] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [t, n, b, r] = await Promise.all([
          productsApi.featured('trending', 8),
          productsApi.featured('new', 4),
          productsApi.featured('bestseller', 4),
          reviewsApi.homepage(),
        ])
        if (cancelled) return
        setTrending(t.products)
        setArrivals(n.products)
        setBestsellers(b.products)
        setReviews(r.reviews)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load products')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[78vh] overflow-hidden bg-ink text-white">
        <ProductImage
          src={HERO_IMG}
          alt="Premium sneakers lifestyle"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <p className="animate-fade-up font-display text-sm font-bold tracking-[0.25em] text-accent">
            {BRAND.name}
          </p>
          <h1 className="animate-fade-up mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: '80ms' }}>
            {BRAND.heroHeadline}
          </h1>
          <p className="animate-fade-up mt-5 max-w-md text-base text-white/85 sm:text-lg" style={{ animationDelay: '140ms' }}>
            {BRAND.heroSub}
          </p>
          <div className="animate-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: '200ms' }}>
            <Button to="/catalogue" variant="primary">
              Shop Collection
            </Button>
            <Button to="/catalogue?tag=new" variant="outline" className="border-white text-white hover:bg-white hover:text-ink">
              Explore New Arrivals
            </Button>
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Shop by category</h2>
          <p className="mt-2 text-sm text-ink-muted">Find the right pair for every move.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/catalogue?${cat.param}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl"
            >
              <ProductImage
                src={cat.image}
                alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute bottom-3 left-3 font-display text-sm font-bold text-white sm:text-base">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Trending sneakers</h2>
            <p className="mt-2 text-sm text-ink-muted">Popular picks from our demo catalogue.</p>
          </div>
          <Link to="/catalogue?tag=trending" className="text-sm font-semibold text-accent hover:underline">
            View all
          </Link>
        </div>
        {loading && <GridSkeleton />}
        {error && <p className="text-danger">{error}</p>}
        {!loading && !error && <ProductGrid products={trending} />}
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">New arrivals</h2>
          <p className="mt-2 text-sm text-ink-muted">Fresh drops labeled as new in the catalogue.</p>
        </div>
        {!loading && <ProductGrid products={arrivals} />}
      </section>

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-ink text-white">
          <ProductImage
            src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1400&q=80"
            alt="Campaign sneakers"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="relative px-8 py-16 sm:px-12 sm:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Season edit</p>
            <h2 className="mt-3 max-w-md font-display text-3xl font-bold sm:text-4xl">
              Move lighter. Look sharper.
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              Explore performance and lifestyle sneakers curated for everyday wear.
            </p>
            <Button to="/catalogue" className="mt-6">
              Explore Collection
            </Button>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Best sellers</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Highlighted from catalogue tags — not invented live sales stats.
          </p>
        </div>
        {!loading && <ProductGrid products={bestsellers} />}
      </section>

      {/* Why shop */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Lock, title: 'Secure checkout', text: 'Protected account sessions and server-side order validation.' },
            { icon: Truck, title: 'Reliable delivery', text: 'Estimated delivery windows based on configured demo rules.' },
            { icon: RefreshCcw, title: 'Easy returns', text: 'Subject to our returns policy for eligible items.' },
            { icon: Headphones, title: 'Customer support', text: 'Reach us via the contact page for order help.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-accent" aria-hidden />
              <h3 className="mt-3 font-display text-base font-bold">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Customer reviews</h2>
          <p className="mt-2 text-sm text-ink-muted">Sample content for demonstration — not verified purchases.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <blockquote key={r.id} className="rounded-xl border border-line bg-white p-6">
              <StarRating rating={r.rating} />
              <p className="mt-3 text-sm text-ink">{r.body}</p>
              <footer className="mt-4 text-xs font-semibold text-ink-muted">
                {r.authorName}
                {r.demoLabel && <span className="ml-2 font-normal">· {r.demoLabel}</span>}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="skeleton aspect-square rounded-xl" />
          <div className="skeleton h-3 w-1/3 rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  )
}
