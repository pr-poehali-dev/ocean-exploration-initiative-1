import { useState, useEffect, useCallback } from "react"
import { getMe, getToken, setToken, removeToken } from "@/lib/api"

export interface User {
  id: number
  email: string
  name: string
  avatar_url: string | null
  is_admin: boolean
  subscription: {
    plan: string
    tokens_limit: number
    tokens_used: number
    expires_at: string | null
    is_active: boolean
  } | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    try {
      const u = await getMe()
      setUser(u)
    } catch {
      removeToken()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = (token: string, userData: User) => {
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    removeToken()
    setUser(null)
  }

  const refresh = () => loadUser()

  return { user, loading, login, logout, refresh }
}
