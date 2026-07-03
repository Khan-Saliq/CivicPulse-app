import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { AnimatedPage } from '../components/ui/AnimatedPage'
import { getUserNotifications, markUserNotificationRead } from '../services/notificationService'
import { useAuth } from '../context/AuthContext'
import type { UserNotification } from '../types'

export function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadNotifications = async () => {
      try {
        const items = await getUserNotifications()
        setNotifications(items)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user])

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await markUserNotificationRead(id)
      setNotifications((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Notifications</h1>
            <p className="text-slate-400">Updates for your reported or supported issues.</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? (
          <p className="text-slate-400">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-slate-400">No notifications yet.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`glass-card p-4 transition duration-200 ${notification.read ? 'opacity-70' : 'shadow-[0_0_30px_rgba(56,189,248,0.15)]'}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{notification.title}</p>
                    <p className="text-sm text-slate-400">{notification.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
                    {notification.issue?.title && (
                      <p className="mt-2 text-xs text-cyan-300">Issue: {notification.issue.title}</p>
                    )}
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      className="btn-ghost rounded-xl px-4 py-2 text-sm"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedPage>
    </Layout>
  )
}
