import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { createMessage, getUserChatResponse } from '../../services/chatService'
import type { ChatMessage, Issue } from '../../types'

interface ChatbotProps {
  issues: Issue[]
  suggestions: string[]
  title?: string
  placeholder?: string
}

export function Chatbot({
  issues,
  suggestions,
  title = 'AI Assistant',
  placeholder = 'Ask about reporting, priorities, trust scores...',
}: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      'assistant',
      'Hello! I\'m your CivicSync assistant. I can guide you through reporting, suggest existing issues, and share insights about critical areas.'
    ),
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = (text: string) => {
    if (!text.trim()) return
    const userMsg = createMessage('user', text.trim())
    const reply = getUserChatResponse(text, issues)
    const assistantMsg = createMessage('assistant', reply)
    setMessages((m) => [...m, userMsg, assistantMsg])
    setInput('')
  }

  return (
    <div className="glass-card flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-2 text-cyan-400">
          <Bot className="h-5 w-5 animate-float" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-500">Powered by AI (demo mode)</p>
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
            placeholder={placeholder}
            className="input-dark flex-1 text-sm"
          />
          <button
            type="submit"
            className="btn-primary rounded-xl p-2.5"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
