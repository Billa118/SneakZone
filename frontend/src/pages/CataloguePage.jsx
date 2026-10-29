import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productsApi } from '../services/api'
import ProductGrid from '../components/product/ProductGrid'
import Button from '../components/ui/Button'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
]

export default function CataloguePage() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const filters = useMemo(
    () => ({
      search: params.get('search') || '',
      category: params.get('category') || '',
      gender: params.get('gender') || '',
      brand: params.get('brand') || '',
      size: params.get('size') || '',
      color: params.get('color') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      minDiscount: params.get('minDiscount') || '',
      minRating: params.get('minRating') || '',
      tag: params.get('tag') || '',
      sort: params.get('sort') || 'featured',
      page: params.get('page') || '1',
    }),
    [params]
  )

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value) next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const clearAll = () => setParams({})

  useEffect(() => {
    productsApi.filtersMeta().then(setMeta).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    productsApi
      .list({ ...filters, perPage: 12 })
      .then((data) => {
        if (cancelled) return
        setProducts(data.products)
        setPagination(data.pagination)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load products')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters])

  const title = filters.search
    ? `Results for “${filters.search}”`
    : filters.category
      ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
      : filters.gender
        ? filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1)
        : filters.tag === 'new'
          ? 'New Arrivals'
          : 'All sneakers'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="text-xs text-ink-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Catalogue</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {pagination ? `${pagination.total} products` : 'Loading…'}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink-muted">Sort</span>
          <select
            value={filters.sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-5 rounded-xl border border-line bg-white p-4 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide">Filters</h2>
            <button type="button" onClick={clearAll} className="text-xs font-semibold text-accent">
              Clear all
            </button>
          </div>

          <FilterField label="Search">
            <input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Name or brand"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
          </FilterField>

          <FilterField label="Category">
            <select
              value={filters.category}
              onChange={(e) => setFilter('category', e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {meta?.categories?.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Brand">
            <select
              value={filters.brand}
              onChange={(e) => setFilter('brand', e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {meta?.brands?.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Size">
            <select
              value={filters.size}
              onChange={(e) => setFilter('size', e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {meta?.sizes?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Color">
            <select
              value={filters.color}
              onChange={(e) => setFilter('color', e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {meta?.colors?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Price (INR)">
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilter('minPrice', e.target.value)}
                className="w-full rounded-lg border border-line px-2 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilter('maxPrice', e.target.value)}
                className="w-full rounded-lg border border-line px-2 py-2 text-sm"
              />
            </div>
          </FilterField>

          <FilterField label="Min discount %">
            <input
              type="number"
              min="0"
              max="90"
              value={filters.minDiscount}
              onChange={(e) => setFilter('minDiscount', e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
          </FilterField>

          <FilterField label="Min rating">
            <select
              value={filters.minRating}
              onChange={(e) => setFilter('minRating', e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </FilterField>
        </aside>

        <div>
          {loading && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-xl" />
              ))}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-danger/30 bg-white p-6 text-danger">
              {error}
            </div>
          )}
          {!loading && !error && (
            <>
              <ProductGrid products={products} emptyMessage="No products match these filters." />
              {pagination && pagination.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    disabled={!pagination.hasPrev}
                    onClick={() => setFilter('page', String(pagination.page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-ink-muted">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!pagination.hasNext}
                    onClick={() => setFilter('page', String(pagination.page + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterField({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      {children}
    </label>
  )
}
