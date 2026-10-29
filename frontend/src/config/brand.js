/** Central brand config — rename here to rebrand the storefront. */
export const BRAND = {
  name: 'SNEAKZONE',
  tagline: 'Step into your style.',
  heroHeadline: 'STEP INTO YOUR STYLE.',
  heroSub: 'Discover sneakers built for your everyday moves.',
  announcement: 'Free delivery on eligible orders over ₹2,999',
  currency: 'INR',
  currencySymbol: '₹',
  supportEmail: 'support@sneakzone.local',
  supportPhone: '+91 1800 000 000',
  social: {
    instagram: 'https://instagram.com',
    twitter: 'https://twitter.com',
    youtube: 'https://youtube.com',
  },
}

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Men', path: '/catalogue?gender=men' },
  { label: 'Women', path: '/catalogue?gender=women' },
  { label: 'Kids', path: '/catalogue?gender=kids' },
  { label: 'Sports', path: '/catalogue?category=sports' },
  { label: 'New Arrivals', path: '/catalogue?tag=new' },
  { label: 'Offers', path: '/catalogue?minDiscount=10' },
  { label: 'Your Orders', path: '/orders' },
  { label: 'Track Order', path: '/track' },
]

export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount ?? 0)
