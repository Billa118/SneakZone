import { Star } from 'lucide-react'

export default function StarRating({ rating = 0, count, note }) {
  if (!rating) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <span className="inline-flex items-center gap-0.5 font-medium text-ink">
        <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
        {rating.toFixed(1)}
      </span>
      {typeof count === 'number' && (
        <span className="text-ink-muted">({count})</span>
      )}
      {note && <span className="text-xs text-ink-muted">{note}</span>}
    </div>
  )
}
