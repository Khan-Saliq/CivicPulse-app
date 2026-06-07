import { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { createMessage, getAdminChatResponse } from '../../services/chatService'
import { ADMIN_CHAT_SUGGESTIONS } from '../../data/mockData'
import { useIssues } from '../../context/IssueContext'
import { updateUserTrust } from '../../services/authService'
import type { ChatMessage, Issue } from '../../types'
import { Bot, Send, Sparkles } from 'lucide-react'

export function AdminValidation() {
  const { issues, updateValidation } = useIssues()
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      'assistant',
      'Admin AI Validation Assistant ready. Select an issue, then ask me to validate its image for morph detection. I classify evidence as Valid, Suspicious, or Manipulated.'
    ),
  ])
  const [input, setInput] = useState('')

  const pendingIssues = issues.filter(
    (i) => i.validationResult === 'pending' || i.validationResult === 'suspicious'
  )

  const send = (text: string) => {
    if (!text.trim()) return
    const userMsg = createMessage('user', text.trim())
    const { content, validationResult } = getAdminChatResponse(text, issues, selectedIssue ?? undefined)
    const assistantMsg = createMessage('assistant', content, validationResult)

    if (validationResult && selectedIssue) {
      let trustDelta = 0
      if (validationResult === 'valid') trustDelta = 5
      if (validationResult === 'suspicious') trustDelta = -3
      if (validationResult === 'manipulated') trustDelta = -15
      const newTrust = Math.max(0, Math.min(100, selectedIssue.reporterTrustScore + trustDelta))
      updateUserTrust(selectedIssue.reporterId, trustDelta)
      updateValidation(selectedIssue.id, validationResult, newTrust)
    }

    setMessages((m) => [...m, userMsg, assistantMsg])
    setInput('')
  }

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          AI <span className="text-gradient">Validation</span>
        </h1>
        <p className="mt-1 text-slate-400">
          Morph detection for image authenticity — Valid, Suspicious, or Manipulated.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="glass-card p-4 animate-fade-in-up stagger-1">
            <h2 className="font-semibold text-slate-100">Select Issue</h2>
            <div className="mt-3 max-h-[500px] space-y-2 overflow-y-auto">
              {pendingIssues.map((issue, i) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-300 animate-fade-in-up stagger-${(i % 6) + 1} ${
                    selectedIssue?.id === issue.id
                      ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:border-violet-500/30 hover:bg-violet-500/5'
                  }`}
                >
                  <p className="font-medium text-slate-100">{issue.title}</p>
                  <p className="text-xs text-slate-500">
                    {issue.validationResult} · Priority{' '}
                    <span className="text-cyan-400">{issue.priorityScore}</span>
                  </p>
                  {issue.imageUrl && (
                    <img
                      src={issue.imageUrl}
                      alt=""
                      className="mt-2 h-16 w-full rounded-lg object-cover ring-1 ring-white/10"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 animate-fade-in-up stagger-2">
            <div className="glass-card flex h-full flex-col overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <div className="rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-2 text-cyan-400">
                  <Bot className="h-5 w-5 animate-float" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">Morph Detection Chatbot</h3>
                  <p className="text-xs text-slate-500">
                    {selectedIssue ? `Validating: ${selectedIssue.title}` : 'No issue selected'}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: '360px' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-lg shadow-cyan-500/20'
                          : msg.validationResult === 'manipulated'
                            ? 'border border-red-500/30 bg-red-500/10 text-red-200'
                            : msg.validationResult === 'valid'
                              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                              : 'border border-white/5 bg-white/5 text-slate-200'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 p-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {ADMIN_CHAT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 transition-all duration-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300"
                    >
                      <Sparkles className="h-3 w-3" />
                      {s}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    send(input)
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Validate this image for morph detection..."
                    className="input-dark flex-1 text-sm"
                  />
                  <button type="submit" className="btn-primary rounded-xl p-2.5">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  )
}
