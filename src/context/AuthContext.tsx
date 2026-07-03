import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '../services/authService'
import { ApiError, getToken } from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user: Omit<User, 'password'> | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (data: { name: string; email: string; password: string }) => Promise<string | null>
  logout: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    const me = await authService.validateSession()
    setUser(me)
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const loggedIn = await authService.login(email, password)
      setUser(loggedIn)
      return null
    } catch (e) {
      if (e instanceof ApiError) return e.message
      return 'Login failed. Is the API server running?'
    }
  }, [])

  const register = useCallback(
    async (data: { name: string; email: string; password: string }) => {
      try {
        const newUser = await authService.register(data)
        setUser(newUser)
        return null
      } catch (e) {
        if (e instanceof ApiError) return e.message
        return 'Registration failed. Is the API server running?'
      }
    },
    []
  )

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshSession }),
    [user, loading, login, register, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
