import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const persist = (accessToken, refreshToken, nextUser) => {
    if (accessToken) localStorage.setItem('sz_access_token', accessToken)
    if (refreshToken) localStorage.setItem('sz_refresh_token', refreshToken)
    setUser(nextUser)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('sz_access_token')
    localStorage.removeItem('sz_refresh_token')
    setUser(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('sz_access_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [logout])

  const login = async (email, password) => {
    const data = await authApi.login({ email, password })
    persist(data.accessToken, data.refreshToken, data.user)
    return data.user
  }

  const register = async (payload) => {
    const data = await authApi.register(payload)
    persist(data.accessToken, data.refreshToken, data.user)
    return data.user
  }

  const updateProfile = async (payload) => {
    const data = await authApi.updateMe(payload)
    setUser(data.user)
    return data.user
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
