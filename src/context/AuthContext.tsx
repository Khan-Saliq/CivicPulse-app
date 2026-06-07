import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '../services/authService'
import type { User } from '../types'

interface AuthContextValue {
  user: Omit<User, 'password'> | null
  login: (email: string, password: string) => Promise<string | null>
  register: (data: { name: string; email: string; password: string }) => Promise<string | null>
  logout: () => void
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, 'password'> | null>(() => authService.getSession())

  const refreshSession = useCallback(() => {
    setUser(authService.getSession())
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const found = authService.login(email, password)
    if (!found) return 'Invalid email or password'
    const { password: _, ...safe } = found
    setUser(safe)
    return null
  }, [])

  const register = useCallback(
    async (data: { name: string; email: string; password: string }) => {
      try {
        const newUser = authService.register(data)
        const { password: _, ...safe } = newUser
        setUser(safe)
        return null
      } catch (e) {
        return e instanceof Error ? e.message : 'Registration failed'
      }
    },
    []
  )

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, logout, refreshSession }),
    [user, login, register, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
