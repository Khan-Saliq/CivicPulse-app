import type { ChatMessage, Issue, ValidationResult } from '../types'
import { getAllIssues } from './issueService'

export function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function getUserChatResponse(input: string, issues: Issue[]): string {
  const lower = input.toLowerCase()

  if (lower.includes('critical') || lower.includes('priority') || lower.includes('area')) {
    const top = [...issues]
      .filter((i) => i.status !== 'resolved')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3)
    if (top.length === 0) return 'No active critical issues in the system right now.'
    return `Top critical areas:\n${top
      .map(
        (i, n) =>
          `${n + 1}. ${i.location.address} — ${i.title} (Priority: ${i.priorityScore})`
      )
      .join('\n')}`
  }

  if (lower.includes('duplicate') || lower.includes('existing')) {
    return 'Before submitting, check the "Nearby Issues" page. If your issue already exists, vote on it instead of creating a duplicate. The system clusters similar reports automatically.'
  }

  if (lower.includes('trust')) {
    return 'Your Trust Score = Verified Reports ÷ Total Reports. It increases when your reports are verified with valid evidence, and decreases for false or manipulated submissions. Higher trust boosts your issue priority.'
  }

  if (lower.includes('common') || lower.includes('type')) {
    const counts: Record<string, number> = {}
    issues.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return `Most common issue types:\n${sorted.map(([cat, n]) => `• ${cat.replace('_', ' ')}: ${n} reports`).join('\n')}`
  }

  if (lower.includes('report') || lower.includes('submit')) {
    return 'To report an issue: go to Report Issue, add a title, description, category, severity (1–5), location, and photo evidence. Our system will check for duplicates and calculate priority automatically.'
  }

  if (lower.includes('status') || lower.includes('track')) {
    return 'Track your issues under "My Issues". Status flows: Reported → In Progress → Resolved. You\'ll see priority scores and validation status for each report.'
  }

  return 'I can help you report issues, find duplicates, understand trust scores, or show critical areas. Try asking about priority areas or how to report an issue.'
}

export function getAdminChatResponse(
  input: string,
  issues: Issue[],
  selectedIssue?: Issue
): { content: string; validationResult?: ValidationResult } {
  const lower = input.toLowerCase()

  if (
    lower.includes('validate') ||
    lower.includes('morph') ||
    lower.includes('image') ||
    lower.includes('detect')
  ) {
    if (!selectedIssue) {
      return {
        content:
          'Select an issue from the list first, then ask me to validate its image. I\'ll run morph detection and classify as Valid, Suspicious, or Manipulated.',
      }
    }

    const result = simulateMorphDetection(selectedIssue)
    const labels: Record<ValidationResult, string> = {
      valid: '✅ VALID — Image appears authentic. Recommend increasing reporter trust score.',
      suspicious: '⚠️ SUSPICIOUS — Minor inconsistencies detected. Manual review recommended.',
      manipulated: '🚫 MANIPULATED — Evidence of digital alteration detected. Trust score should decrease and priority adjusted.',
      pending: 'Analysis pending.',
    }

    return {
      content: `Morph Detection Result for "${selectedIssue.title}":\n\n${labels[result]}\n\nConfidence: ${result === 'valid' ? '94%' : result === 'suspicious' ? '72%' : '89%'}\n\nTrust score and priority will be updated automatically.`,
      validationResult: result,
    }
  }

  if (lower.includes('priority') || lower.includes('high')) {
    const high = issues.filter((i) => i.priorityScore >= 7 && i.status !== 'resolved')
    return {
      content: `High-priority issues (${high.length}):\n${high.map((i) => `• [${i.priorityScore}] ${i.title} — ${i.status}`).join('\n') || 'None currently.'}`,
    }
  }

  if (lower.includes('suspicious') || lower.includes('fake')) {
    const flagged = issues.filter(
      (i) => i.validationResult === 'suspicious' || i.validationResult === 'manipulated'
    )
    return {
      content: `Flagged reports (${flagged.length}):\n${flagged.map((i) => `• ${i.title} — ${i.validationResult} (Trust: ${i.reporterTrustScore}%)`).join('\n') || 'No flagged reports.'}`,
    }
  }

  if (lower.includes('cluster') || lower.includes('density')) {
    const clusters = new Map<string, Issue[]>()
    issues.forEach((i) => {
      const key = i.clusterId || i.id
      if (!clusters.has(key)) clusters.set(key, [])
      clusters.get(key)!.push(i)
    })
    const dense = [...clusters.entries()]
      .map(([id, items]) => ({ id, count: items.reduce((s, i) => s + i.reportCount, 0), area: items[0].location.address }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    return {
      content: `Top cluster densities:\n${dense.map((c, n) => `${n + 1}. ${c.area} — ${c.count} combined reports`).join('\n')}`,
    }
  }

  return {
    content:
      'I can validate images (morph detection), summarize priorities, list suspicious reports, or show cluster density. Select an issue and ask me to validate its image.',
  }
}

function simulateMorphDetection(issue: Issue): ValidationResult {
  if (issue.validationResult !== 'pending') return issue.validationResult
  if (issue.severity <= 2 && issue.reportCount === 1) return 'manipulated'
  if (issue.severity >= 4 && issue.reportCount >= 5) return 'valid'
  return 'suspicious'
}

export function createMessage(
  role: ChatMessage['role'],
  content: string,
  validationResult?: ValidationResult
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    validationResult,
  }
}

export function getIssuesForChat(): Issue[] {
  return getAllIssues()
}
