import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { createMessage, getChatGreeting, sendCitizenMessage } from '../../services/chatService'
import type { ChatMessage } from '../../types'
import { useConfig } from '../../context/ConfigContext'

export function Chatbot({ title = 'AI Assistant', placeholder = 'Ask about reporting, priorities, trust scores...' }) {
  const { config } = useConfig()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<number | null>(null)

  const suggestions = config?.chatSuggestions.citizen ?? []

  useEffect(() => {
    getChatGreeting('citizen')
      .then((greeting) => setMessages([createMessage('assistant', greeting)]))
      .catch(() =>
        setMessages([
          createMessage('assistant', 'Hello! Ask me about reporting issues or priority areas.'),
        ])
      )
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearInterval(typingTimerRef.current)
      }
    }
  }, [])

  const animateAssistantResponse = (messageId: string, content: string) => {
    if (typingTimerRef.current) {
      window.clearInterval(typingTimerRef.current)
    }

    const words = content.split(' ')
    let index = 0

    setMessages((current) =>
      current.map((msg) => (msg.id === messageId ? { ...msg, content: '...' } : msg))
    )

    typingTimerRef.current = window.setInterval(() => {
      index += 1
      setMessages((current) =>
        current.map((msg) =>
          msg.id === messageId ? { ...msg, content: words.slice(0, index).join(' ') } : msg
        )
      )

      if (index >= words.length) {
        if (typingTimerRef.current) {
          window.clearInterval(typingTimerRef.current)
          typingTimerRef.current = null
        }
      }
    }, 35)
  }

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    const userMsg = createMessage('user', text.trim())
    const assistantMsg = createMessage('assistant', '')

    setMessages((m) => [...m, userMsg, assistantMsg])
    setInput('')
    setSending(true)

    try {
      const response = await sendCitizenMessage(text, sessionId)
      setSessionId(response.sessionId)
      animateAssistantResponse(assistantMsg.id, response.content)
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsg.id
            ? { ...msg, content: 'Sorry, I could not reach the server. Please try again.' }
            : msg
        )
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="glass-card flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-2 text-cyan-400">
          <Bot className="h-5 w-5 animate-float" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-500">CivicPulse AI Assistant</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: '420px' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'border border-white/5 bg-white/5 text-slate-200'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/5 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={sending}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 transition-all duration-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 disabled:opacity-50"
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
            placeholder={placeholder}
            disabled={sending}
            className="input-dark flex-1 text-sm disabled:opacity-50"
          />
          <button type="submit" disabled={sending} className="btn-primary rounded-xl p-2.5 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
