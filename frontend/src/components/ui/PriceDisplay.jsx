import { formatINR } from '../../config/brand'

export default function PriceDisplay({ price, originalPrice, discountPercent, size = 'md' }) {
  const priceClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-semibold text-ink ${priceClass}`}>{formatINR(price)}</span>
      {originalPrice && originalPrice > price && (
        <>
          <span className="text-sm text-ink-muted line-through">{formatINR(originalPrice)}</span>
          {discountPercent > 0 && (
            <span className="text-sm font-medium text-accent">{discountPercent}% off</span>
          )}
        </>
      )}
    </div>
  )
}
