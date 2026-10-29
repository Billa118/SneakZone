import { useState } from 'react'

const FALLBACK =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <rect fill="#ebe7e1" width="800" height="800"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#5c5c5c" font-family="sans-serif" font-size="28">SNEAKZONE</text>
    </svg>`
  )

export default function ProductImage({ src, alt, className = '' }) {
  const [url, setUrl] = useState(src || FALLBACK)
  return (
    <img
      src={url}
      alt={alt || 'Sneaker'}
      className={className}
      loading="lazy"
      onError={() => setUrl(FALLBACK)}
    />
  )
}
