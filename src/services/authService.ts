import { DEMO_USERS } from '../data/mockData'
import { loadFromStorage, saveToStorage } from './storage'
import type { User } from '../types'

const SESSION_KEY = 'session'
const USERS_KEY = 'users'

function getUsers(): User[] {
  return loadFromStorage(USERS_KEY, DEMO_USERS)
}

export function login(email: string, password: string): User | null {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  )
  if (!user) return null
  const { password: _, ...safe } = user
  saveToStorage(SESSION_KEY, safe)
  return user
}

export function register(data: {
  name: string
  email: string
  password: string
}): User {
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('Email already registered')
  }
  const newUser: User = {
    id: `u${Date.now()}`,
    name: data.name,
    email: data.email,
    role: 'citizen',
    trustScore: 50,
    verifiedReports: 0,
    totalReports: 0,
    password: data.password,
  }
  users.push(newUser)
  saveToStorage(USERS_KEY, users)
  const { password: _, ...safe } = newUser
  saveToStorage(SESSION_KEY, safe)
  return newUser
}

export function getSession(): Omit<User, 'password'> | null {
  return loadFromStorage<Omit<User, 'password'> | null>(SESSION_KEY, null)
}

export function logout(): void {
  localStorage.removeItem('civicsync_' + SESSION_KEY)
}

export function updateUserTrust(userId: string, delta: number): void {
  const users = getUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) return
  users[idx].trustScore = Math.max(0, Math.min(100, users[idx].trustScore + delta))
  if (delta > 0) users[idx].verifiedReports += 1
  users[idx].totalReports = Math.max(users[idx].totalReports, users[idx].verifiedReports)
  saveToStorage(USERS_KEY, users)
  const session = getSession()
  if (session?.id === userId) {
    const { password: _, ...safe } = users[idx]
    saveToStorage(SESSION_KEY, safe)
  }
}
