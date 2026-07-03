import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, LogOut, MapPin, Menu, Shield, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAdminNotifications, getUserNotifications } from '../../services/notificationService'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
    isActive
      ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
      : 'text-slate-400 hover:bg-white/5 hover:text-cyan-300'
  }`

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0)
      return
    }

    const loadNotifications = async () => {
      try {
        const notifications = user.role === 'admin'
          ? await getAdminNotifications()
          : await getUserNotifications()
        setUnreadNotifications(notifications.filter((notification) => !notification.read).length)
      } catch {
        setUnreadNotifications(0)
      }
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 30000)
    return () => window.clearInterval(interval)
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
    setOpen(false)
  }

  const citizenLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/report', label: 'Report Issue' },
    { to: '/my-issues', label: 'My Issues' },
    { to: '/notifications', label: 'Notifications' },
    { to: '/nearby', label: 'Nearby' },
    { to: '/uploads', label: 'Uploads' },
    { to: '/chat-history', label: 'Chat History' },
    { to: '/heatmap', label: 'Heatmap' },
  ]

  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/issues', label: 'Issues' },
    { to: '/admin/validation', label: 'AI Validation' },
    { to: '/admin/notifications', label: 'Notifications' },
    { to: '/uploads', label: 'Uploads' },
    { to: '/chat-history', label: 'Chat History' },
    { to: '/heatmap', label: 'Heatmap' },
  ]

  const links = user?.role !== 'citizen' ? adminLinks : citizenLinks

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to={user ? (user.role !== 'citizen' ? '/admin' : '/dashboard') : '/'}
          className="group flex items-center gap-2 transition-transform duration-300 hover:scale-105"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/25 transition-shadow group-hover:shadow-cyan-500/40">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-100">
            Civic<span className="text-gradient">Pulse</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {user &&
            links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navLinkClass}>
                {l.label}
              </NavLink>
            ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <button
                onClick={() => navigate(user?.role !== 'citizen' ? '/admin/notifications' : '/notifications')}
                className="relative rounded-xl p-2 text-slate-200 transition hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[0.65rem] font-semibold text-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-100">{user.name}</p>
                <p className="flex items-center justify-end gap-1 text-xs text-slate-500">
                  <Shield className="h-3 w-3 text-violet-400" />
                  {user.role !== 'citizen' ? (
                    <span className="text-violet-400">
                      {user.role === 'admin' ? 'Administrator' : 'Department Admin'}
                    </span>
                  ) : (
                    <>Trust: <span className="text-cyan-400">{user.trustScore}%</span></>
                  )}
                </p>
              </div>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-cyan-300 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in border-t border-white/5 px-4 py-3 md:hidden">
          {user &&
            links.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${navLinkClass({ isActive: false })} animate-fade-in-up stagger-${i + 1}`}
              >
                {l.label}
              </NavLink>
            ))}
          {user ? (
            <button
              onClick={handleLogout}
              className="btn-ghost mt-2 w-full text-left text-sm"
            >
              Logout
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-center text-sm">
                Login
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 text-center text-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
