const API_URL = import.meta.env.VITE_API_URL || '/api'

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function getToken() {
  return localStorage.getItem('sz_access_token')
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  let data = null
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text || 'Unexpected response' }
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data)
  }
  return data
}

export const productsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v)
    })
    const q = qs.toString()
    return api(`/products/${q ? `?${q}` : ''}`)
  }, // trailing slash required for Flask list route

  featured: (tag = 'trending', limit = 8) =>
    api(`/products/featured?tag=${encodeURIComponent(tag)}&limit=${limit}`),
  detail: (id) => api(`/products/${id}`),
  related: (id) => api(`/products/related/${id}`),
  filtersMeta: () => api('/products/filters/meta'),
  categories: () => api('/products/categories'),
  deliveryEstimate: (pin) => api(`/products/delivery-estimate?pin=${encodeURIComponent(pin)}`),
}

export const authApi = {
  register: (body) => api('/auth/register', { method: 'POST', body }),
  login: (body) => api('/auth/login', { method: 'POST', body }),
  me: () => api('/auth/me'),
  updateMe: (body) => api('/auth/me', { method: 'PATCH', body }),
  changePassword: (body) => api('/auth/change-password', { method: 'POST', body }),
}

export const wishlistApi = {
  list: () => api('/wishlist/'),
  add: (productId) => api('/wishlist/', { method: 'POST', body: { productId } }),
  remove: (productId) => api(`/wishlist/${productId}`, { method: 'DELETE' }),
}

export const ordersApi = {
  quote: (body) => api('/orders/quote', { method: 'POST', body }),
  create: (body) => api('/orders/', { method: 'POST', body }),
  mine: () => api('/orders/mine'),
  track: (ref, email) =>
    api(`/orders/track/${encodeURIComponent(ref)}${email ? `?email=${encodeURIComponent(email)}` : ''}`),
  deliveryOptions: (pin) =>
    api(`/orders/delivery-options${pin ? `?pin=${encodeURIComponent(pin)}` : ''}`),
  get: (id) => api(`/orders/${id}`),
}

export const couponsApi = {
  validate: (code, subtotal) =>
    api('/coupons/validate', { method: 'POST', body: { code, subtotal } }),
}

export const addressesApi = {
  list: () => api('/addresses/'),
  create: (body) => api('/addresses/', { method: 'POST', body }),
  remove: (id) => api(`/addresses/${id}`, { method: 'DELETE' }),
}

export const reviewsApi = {
  product: (id) => api(`/reviews/product/${id}`),
  homepage: () => api('/reviews/homepage'),
}

export const adminApi = {
  dashboard: () => api('/admin/dashboard'),
  products: () => api('/admin/products'),
  createProduct: (body) => api('/admin/products', { method: 'POST', body }),
  updateProduct: (id, body) => api(`/admin/products/${id}`, { method: 'PUT', body }),
  deleteProduct: (id) => api(`/admin/products/${id}`, { method: 'DELETE' }),
  categories: () => api('/admin/categories'),
  createCategory: (body) => api('/admin/categories', { method: 'POST', body }),
  orders: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api(`/admin/orders${qs ? `?${qs}` : ''}`)
  },
  updateOrderStatus: (id, status) =>
    api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  coupons: () => api('/admin/coupons'),
  createCoupon: (body) => api('/admin/coupons', { method: 'POST', body }),
  updateCoupon: (id, body) => api(`/admin/coupons/${id}`, { method: 'PATCH', body }),
  customers: () => api('/admin/customers'),
}

export const configApi = {
  public: () => api('/config/public'),
}

export { ApiError }
