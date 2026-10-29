import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-accent text-white hover:bg-accent-hover disabled:bg-cream-dark disabled:text-ink-muted',
  secondary:
    'bg-ink text-white hover:bg-black disabled:bg-cream-dark disabled:text-ink-muted',
  outline:
    'border border-ink text-ink hover:bg-ink hover:text-white disabled:opacity-50',
  ghost: 'text-ink hover:bg-cream-dark disabled:opacity-50',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  to,
  type = 'button',
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors duration-200 ${variants[variant]} ${className}`
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
