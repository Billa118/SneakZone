import { BRAND } from '../config/brand'

const CONTENT = {
  about: {
    title: 'About Us',
    body: `${BRAND.name} is a premium demo sneaker storefront built for modern shopping experiences. Sample products are illustrative and not authentic branded merchandise or official partnerships.`,
  },
  contact: {
    title: 'Contact Us',
    body: `Reach the demo support desk at ${BRAND.supportEmail} or ${BRAND.supportPhone}. This is a development environment — messages are not monitored as a live helpdesk.`,
  },
  faqs: {
    title: 'FAQs',
    body: 'How do I track an order? Use Track Order with your reference. Are payments real? In demo mode, no real payment is processed. Can I return items? See Returns & Refunds for the configured policy window.',
  },
  shipping: {
    title: 'Shipping Policy',
    body: 'Delivery estimates are generated from demo PIN-code rules. Free delivery may apply above the configured threshold. Express options add a surcharge. Estimates are not live courier guarantees.',
  },
  returns: {
    title: 'Returns & Refunds',
    body: 'Eligible unworn items may be returned within 7 days of delivery in this demo policy. Refunds for demo orders are illustrative only. Size exchanges depend on available stock.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'We store account credentials as secure password hashes, order details for fulfillment, and optional addresses. Do not submit real payment card data — this demo does not accept raw card numbers or UPI PINs.',
  },
  terms: {
    title: 'Terms & Conditions',
    body: `By using ${BRAND.name} you agree that this is a demonstration storefront. Prices, stock, and delivery timelines are for development and evaluation. Demo coupons and orders are clearly labeled.`,
  },
}

export default function StaticPage({ pageKey }) {
  const page = CONTENT[pageKey] || CONTENT.about
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold">{page.title}</h1>
      <p className="mt-6 text-base leading-relaxed text-ink-muted">{page.body}</p>
    </div>
  )
}
