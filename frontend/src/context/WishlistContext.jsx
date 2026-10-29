import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { wishlistApi } from '../services/api'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'sz_wishlist_v1'

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [productIds, setProductIds] = useState(loadLocal)
  const [syncing, setSyncing] = useState(false)

  const persistLocal = (ids) => {
    setProductIds(ids)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }

  const syncFromServer = useCallback(async () => {
    if (!isAuthenticated) return
    setSyncing(true)
    try {
      const data = await wishlistApi.list()
      const ids = data.items.map((i) => i.productId)
      persistLocal(ids)
    } catch {
      // keep local
    } finally {
      setSyncing(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) syncFromServer()
  }, [isAuthenticated, syncFromServer])

  const has = (productId) => productIds.includes(productId)

  const toggle = async (productId) => {
    if (has(productId)) {
      const next = productIds.filter((id) => id !== productId)
      persistLocal(next)
      if (isAuthenticated) {
        try {
          await wishlistApi.remove(productId)
        } catch {
          /* local already updated for demo UX */
        }
      }
      return false
    }
    persistLocal([...productIds, productId])
    if (isAuthenticated) {
      try {
        await wishlistApi.add(productId)
      } catch {
        /* local ok for demo */
      }
    }
    return true
  }

  return (
    <WishlistContext.Provider
      value={{ productIds, has, toggle, syncFromServer, syncing, count: productIds.length }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
