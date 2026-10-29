import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../../config/brand'
import { useToast } from '../../context/ToastContext'

const CURRENT_YEAR = new Date().getFullYear()

export default function Footer() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { push } = useToast()

  const onSubscribe = (e) => {
    e.preventDefault()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!ok) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setEmail('')
    push('Thanks for subscribing (demo — no email was stored).', 'info')
  }

  const links = [
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/faqs', label: 'FAQs' },
    { to: '/shipping', label: 'Shipping Policy' },
    { to: '/returns', label: 'Returns & Refunds' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms & Conditions' },
  ]

  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-2xl font-extrabold">{BRAND.name}</p>
          <p className="mt-3 max-w-sm text-sm text-ink-muted">{BRAND.tagline}</p>
          <div className="mt-5 flex gap-4 text-sm">
            <a href={BRAND.social.instagram} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href={BRAND.social.twitter} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
              X
            </a>
            <a href={BRAND.social.youtube} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
              YouTube
            </a>
          </div>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Explore</h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-sm text-ink-muted hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wider">Newsletter</h2>
          <p className="mt-3 text-sm text-ink-muted">
            Product drops and offers. Demo form — subscriptions are not persisted.
          </p>
          <form onSubmit={onSubscribe} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-accent"
              aria-invalid={!!error}
              aria-describedby={error ? 'newsletter-error' : undefined}
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Subscribe
            </button>
          </form>
          {error && (
            <p id="newsletter-error" className="mt-1 text-xs text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-ink-muted">
        © {CURRENT_YEAR} {BRAND.name}. Demo storefront — sample products are not authentic branded merchandise.
      </div>
    </footer>
  )
}
