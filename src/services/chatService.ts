import { apiFetch } from './api'
import type { ChatHistoryItem, ValidationResult, Issue } from '../types'

export function createMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  validationResult?: ValidationResult
) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    validationResult,
  }
}

export async function getChatGreeting(role: 'citizen' | 'admin'): Promise<string> {
  const { greeting } = await apiFetch<{ greeting: string }>(`/chat/greeting/${role}`)
  return greeting
}

export async function sendCitizenMessage(message: string, sessionId?: string): Promise<{ content: string; sessionId?: string }> {
  const { content, sessionId: returnedSessionId } = await apiFetch<{ content: string; sessionId?: string }>('/chat/citizen', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId }),
  })
  return { content, sessionId: returnedSessionId }
}

export async function sendAdminMessage(message: string, issueId?: string) {
  return apiFetch<{
    content: string
    validationResult?: ValidationResult
    issue?: Issue
  }>('/chat/admin', {
    method: 'POST',
    body: JSON.stringify({ message, issueId }),
  })
}

export async function getChatHistory(): Promise<ChatHistoryItem[]> {
  return apiFetch<ChatHistoryItem[]>('/chat/messages?mine=true')
}
