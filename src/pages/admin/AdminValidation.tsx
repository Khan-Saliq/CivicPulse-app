import { useState, useEffect, useRef } from 'react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { createMessage, getChatGreeting, sendAdminMessage } from '../../services/chatService'
import { apiFetch } from '../../services/api'
import { useIssues } from '../../context/IssueContext'
import { useConfig } from '../../context/ConfigContext'
import { useAuth } from '../../context/AuthContext'
import type { ChatMessage, Issue } from '../../types'
import { Bot, Send, Sparkles, Upload, X } from 'lucide-react'

export function AdminValidation() {
  const { issues, refreshIssues } = useIssues()
  const { config } = useConfig()
  const { user, refreshSession } = useAuth()
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; type: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const pendingIssues = issues.filter((i) => {
    const isPending = i.validationResult === 'pending' || i.validationResult === 'suspicious'
    if (!isPending) return false
    if (user?.role === 'department_admin') {
      return i.responsibleDepartment === user.department
    }
    return true
  })
  const suggestions = config?.chatSuggestions.admin ?? []

  useEffect(() => {
    getChatGreeting('admin')
      .then((greeting) => setMessages([createMessage('assistant', greeting)]))
      .catch(() => setMessages([createMessage('assistant', 'Admin validation assistant ready.')]))
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setUploadedFile({ name: file.name, type: isVideo ? 'video' : 'image' })
      setPreviewUrl(base64)
    }
    reader.readAsDataURL(file)
  }

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    const userMsg = createMessage('user', text.trim())
    setMessages((m) => [...m, userMsg])
    setInput('')
    setSending(true)
    try {
      const response = await sendAdminMessage(text, selectedIssue?.id)
      const assistantMsg = createMessage('assistant', response.content, response.validationResult)
      setMessages((m) => [...m, assistantMsg])
      if (response.validationResult) {
        await refreshIssues()
        await refreshSession()
      }
    } catch {
      setMessages((m) => [...m, createMessage('assistant', 'Failed to reach validation service.')])
    } finally {
      setSending(false)
    }
  }

  const validateMedia = async () => {
    if (!uploadedFile && !selectedIssue) {
      alert('Please select an issue or upload a file first')
      return
    }

    setSending(true)
    const abortController = new AbortController()
    
    try {
      // If only issue is selected, use its imageUrl for validation
      if (selectedIssue && !uploadedFile) {
        if (!selectedIssue.imageUrl) {
          alert('Selected issue has no image to validate')
          setSending(false)
          return
        }
        
        // Fetch the image and convert to base64
        const imageResponse = await fetch(selectedIssue.imageUrl, { signal: abortController.signal })
        if (!imageResponse.ok) throw new Error('Failed to fetch issue image')
        const blob = await imageResponse.blob()
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        const data = await apiFetch<{
          content: string
          validationResult?: string
          detectionResult?: any
          manipulationType?: string
          confidence?: number
          issue?: any
        }>('/chat/admin/validate-media', {
          method: 'POST',
          body: JSON.stringify({
            mediaBase64: base64,
            issueId: selectedIssue.id,
            mediaType: 'image',
          }),
        })

        const assistantMsg = createMessage('assistant', data.content, data.validationResult as any)
        setMessages((m) => [...m, assistantMsg])

        await refreshIssues()
        await refreshSession()
      }
      // If only file is uploaded (standalone validation)
      else if (uploadedFile && previewUrl && !selectedIssue) {
        console.log('Sending standalone validation:', {
          hasPreviewUrl: !!previewUrl,
          previewUrlLength: previewUrl?.length,
          mediaType: uploadedFile.type,
        })

        const data = await apiFetch<{
          content: string
          validationResult?: string
          detectionResult?: any
          manipulationType?: string
          confidence?: number
        }>('/chat/admin/validate-media', {
          method: 'POST',
          body: JSON.stringify({
            mediaBase64: previewUrl,
            issueId: null,
            mediaType: uploadedFile.type,
          }),
        })

        const assistantMsg = createMessage('assistant', data.content, data.validationResult as any)
        setMessages((m) => [...m, assistantMsg])

        setUploadedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
      // If both are selected
      else if (uploadedFile && previewUrl && selectedIssue) {
        const data = await apiFetch<{
          content: string
          validationResult?: string
          detectionResult?: any
          manipulationType?: string
          confidence?: number
          issue?: any
        }>('/chat/admin/validate-media', {
          method: 'POST',
          body: JSON.stringify({
            mediaBase64: previewUrl,
            issueId: selectedIssue.id,
            mediaType: uploadedFile.type,
          }),
        })

        const assistantMsg = createMessage('assistant', data.content, data.validationResult as any)
        setMessages((m) => [...m, assistantMsg])

        setUploadedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

        await refreshIssues()
        await refreshSession()
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Media validation error:', err)
        const errorMessage = err.message || err.error || 'Failed to validate media.'
        setMessages((m) => [...m, createMessage('assistant', `Validation failed: ${errorMessage}`)])
      }
    } finally {
      abortController.abort()
      setSending(false)
    }
  }

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          AI <span className="text-gradient">Validation</span>
        </h1>
        <p className="mt-1 text-slate-400">Morph detection, AI-generation detection, and video manipulation detection.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="glass-card p-4">
            <h2 className="font-semibold text-slate-100">Select Issue</h2>
            <div className="mt-3 max-h-[500px] space-y-2 overflow-y-auto">
              {pendingIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    selectedIssue?.id === issue.id
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : 'border-white/10 bg-white/5 hover:border-violet-500/30'
                  }`}
                >
                  <p className="font-medium text-slate-100">{issue.title}</p>
                  <p className="text-xs text-slate-500">{issue.validationResult} · Priority {issue.priorityScore}</p>
                  {issue.imageUrl && <img src={issue.imageUrl} alt="" className="mt-2 h-16 w-full rounded-lg object-cover" />}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="glass-card flex h-full flex-col overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                <Bot className="h-5 w-5 text-cyan-400 animate-float" />
                <div>
                  <h3 className="font-semibold text-slate-100">Morph Detection Chatbot</h3>
                  <p className="text-xs text-slate-500">{selectedIssue ? selectedIssue.title : 'No issue selected'}</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: '360px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === 'user' ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white' : 'border border-white/5 bg-white/5 text-slate-200'
                    }`}>{msg.content}</div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 border border-cyan-500/30 bg-cyan-500/10">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: '300ms' }} />
                        <span className="ml-2 text-xs text-cyan-300">Analyzing image...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-white/5 p-3">
                {selectedIssue && !uploadedFile && selectedIssue.imageUrl && (
                  <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-100">
                        📎 ISSUE IMAGE: {selectedIssue.title}
                      </p>
                    </div>
                    <div className={`relative ${sending ? 'scanning-container' : ''}`}>
                      <img src={selectedIssue.imageUrl} alt="issue" className="max-h-32 rounded-lg object-cover" />
                      {sending && (
                        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400" />
                      )}
                    </div>
                    <button
                      onClick={validateMedia}
                      disabled={sending}
                      className="mt-2 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-3 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50"
                    >
                      {sending ? '⏳ Analyzing...' : 'Validate Issue Image'}
                    </button>
                  </div>
                )}
                {uploadedFile && previewUrl && (
                  <div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-100">
                        📎 {uploadedFile.type.toUpperCase()}: {uploadedFile.name}
                      </p>
                      <button
                        onClick={() => {
                          setUploadedFile(null)
                          setPreviewUrl(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className={`relative ${sending ? 'scanning-container' : ''}`}>
                      {uploadedFile.type === 'image' && (
                        <img src={previewUrl} alt="preview" className="max-h-32 rounded-lg object-cover" />
                      )}
                      {uploadedFile.type === 'video' && (
                        <video src={previewUrl} controls className="max-h-32 rounded-lg object-cover" />
                      )}
                      {sending && (
                        <div className="absolute inset-0 rounded-lg border-2 border-cyan-400" />
                      )}
                    </div>
                    <button
                      onClick={validateMedia}
                      disabled={sending}
                      className="mt-2 w-full rounded-lg bg-gradient-to-r from-cyan-600 to-violet-600 px-3 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50"
                    >
                      {sending ? '⏳ Analyzing...' : `Validate ${uploadedFile.type.toUpperCase()}`}
                    </button>
                  </div>
                )}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => send(s)} disabled={sending} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-50">
                      <Sparkles className="h-3 w-3" />{s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="rounded-xl bg-white/10 p-2.5 text-slate-400 hover:bg-white/20 hover:text-cyan-400 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <input value={input} onChange={(e) => setInput(e.target.value)} disabled={sending} placeholder="Validate this issue for morph detection..." className="input-dark flex-1 text-sm" />
                  <button onClick={() => send(input)} disabled={sending} className="btn-primary rounded-xl p-2.5 disabled:opacity-50"><Send className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  )
}
