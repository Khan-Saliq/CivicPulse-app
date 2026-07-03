import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { AnimatedPage } from '../components/ui/AnimatedPage'
import { getChatHistory } from '../services/chatService'
import { useAuth } from '../context/AuthContext'
import type { ChatHistoryItem } from '../types'

export function ChatHistory() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchHistory = async () => {
      try {
        const history = await getChatHistory()
        setMessages(history)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [user])

  return (
    <Layout>
      <AnimatedPage>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Chat History</h1>
            <p className="text-slate-400">
              {user?.role === 'admin'
                ? 'Review your own validation assistant conversations.'
                : 'Your previous AI assistant conversations.'}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        {loading ? (
          <p className="text-slate-400">Loading chat history...</p>
        ) : messages.length === 0 ? (
          <p className="text-slate-400">No chat history found yet.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="glass-card p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">{msg.role === 'admin' ? 'Admin conversation' : 'Citizen conversation'}</p>
                      <p className="text-lg font-semibold text-slate-100">
                        {(() => {
                          const date = new Date(msg.timestamp)
                          return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString()
                        })()}
                      </p>
                      {msg.issueId && <p className="mt-1 text-sm text-cyan-300">Issue ID: {msg.issueId}</p>}
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-slate-300 lg:col-span-2">
                    <div className="rounded-2xl bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Your message</p>
                      <p className="mt-2 text-slate-100 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assistant reply</p>
                      <p className="mt-2 text-slate-100 whitespace-pre-wrap">{msg.response}</p>
                    </div>
                    {msg.validationResult && (
                      <p className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Validation: {msg.validationResult}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedPage>
    </Layout>
  )
}
