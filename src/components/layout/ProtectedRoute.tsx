import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types'

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode
  role?: UserRole
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Loading session...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role) {
    const allowed =
      role === 'admin'
        ? user.role === 'admin' || user.role === 'department_admin'
        : user.role === role
    if (!allowed) {
      return <Navigate to={user.role === 'admin' || user.role === 'department_admin' ? '/admin' : '/dashboard'} replace />
    }
  }

  return <>{children}</>
}
