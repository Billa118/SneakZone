import ProductCard from './ProductCard'

export default function ProductGrid({ products, emptyMessage = 'No products found.' }) {
  if (!products?.length) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white px-6 py-16 text-center text-ink-muted">
        {emptyMessage}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
