import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'sz_cart_v1'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [coupon, setCoupon] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (item) => {
    // item: { productId, variantId, name, brand, size, color, imageUrl, unitPrice, quantity, maxStock }
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.variantId === item.variantId && i.productId === item.productId
      )
      if (idx >= 0) {
        const next = [...prev]
        const qty = Math.min(
          next[idx].quantity + item.quantity,
          item.maxStock ?? next[idx].maxStock ?? 99
        )
        next[idx] = { ...next[idx], quantity: qty, maxStock: item.maxStock ?? next[idx].maxStock }
        return next
      }
      return [...prev, { ...item }]
    })
  }

  const updateQuantity = (variantId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.variantId !== variantId) return i
          const qty = Math.max(1, Math.min(quantity, i.maxStock ?? 99))
          return { ...i, quantity: qty }
        })
        .filter((i) => i.quantity > 0)
    )
  }

  const removeItem = (variantId) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }

  const clearCart = () => {
    setItems([])
    setCoupon(null)
  }

  const replaceWithBuyNow = (item) => {
    setItems([{ ...item }])
  }

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items])
  const subtotal = useMemo(
    () => items.reduce((n, i) => n + i.unitPrice * i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        coupon,
        setCoupon,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        replaceWithBuyNow,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
