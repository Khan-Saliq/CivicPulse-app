import { DEMO_ISSUES } from '../data/mockData'
import { calculatePriorityScore } from '../utils/priority'
import { loadFromStorage, saveToStorage } from './storage'
import type { Issue, IssueCategory, IssueStatus, ValidationResult } from '../types'

const ISSUES_KEY = 'issues'

function getIssues(): Issue[] {
  return loadFromStorage(ISSUES_KEY, DEMO_ISSUES)
}

function persist(issues: Issue[]): void {
  saveToStorage(ISSUES_KEY, issues)
}

export function getAllIssues(): Issue[] {
  return getIssues().sort((a, b) => b.priorityScore - a.priorityScore)
}

export function getIssueById(id: string): Issue | undefined {
  return getIssues().find((i) => i.id === id)
}

export function getIssuesByReporter(reporterId: string): Issue[] {
  return getIssues()
    .filter((i) => i.reporterId === reporterId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getNearbyIssues(lat: number, lng: number, radiusKm = 5): Issue[] {
  return getIssues().filter((issue) => {
    const d = haversine(lat, lng, issue.location.lat, issue.location.lng)
    return d <= radiusKm
  })
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function findDuplicateCandidates(
  title: string,
  lat: number,
  lng: number
): Issue[] {
  const keywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  return getIssues().filter((issue) => {
    const near = haversine(lat, lng, issue.location.lat, issue.location.lng) < 0.5
    const similar = keywords.some((k) => issue.title.toLowerCase().includes(k))
    return near && similar && issue.status !== 'resolved'
  })
}

export function createIssue(data: {
  title: string
  description: string
  category: IssueCategory
  severity: number
  location: Issue['location']
  imageUrl?: string
  reporterId: string
  reporterName: string
  reporterTrustScore: number
  mergeWithId?: string
}): Issue {
  const issues = getIssues()
  const now = new Date().toISOString()

  if (data.mergeWithId) {
    const idx = issues.findIndex((i) => i.id === data.mergeWithId)
    if (idx !== -1) {
      issues[idx].reportCount += 1
      issues[idx].votes += 1
      issues[idx].updatedAt = now
      issues[idx].priorityScore = calculatePriorityScore({
        ...issues[idx],
        clusterDensity: issues[idx].reportCount * 1.5,
      })
      persist(issues)
      return issues[idx]
    }
  }

  const issue: Issue = {
    id: `iss-${Date.now()}`,
    title: data.title,
    description: data.description,
    category: data.category,
    severity: data.severity,
    status: 'reported',
    location: data.location,
    imageUrl: data.imageUrl,
    reporterId: data.reporterId,
    reporterName: data.reporterName,
    reporterTrustScore: data.reporterTrustScore,
    reportCount: 1,
    validationResult: 'pending',
    createdAt: now,
    updatedAt: now,
    votes: 1,
    priorityScore: 0,
  }
  issue.priorityScore = calculatePriorityScore({
    ...issue,
    clusterDensity: 1.5,
  })
  issues.push(issue)
  persist(issues)
  return issue
}

export function updateIssueStatus(id: string, status: IssueStatus, assignedTo?: string): Issue | null {
  const issues = getIssues()
  const idx = issues.findIndex((i) => i.id === id)
  if (idx === -1) return null
  issues[idx].status = status
  issues[idx].updatedAt = new Date().toISOString()
  if (assignedTo) issues[idx].assignedTo = assignedTo
  persist(issues)
  return issues[idx]
}

export function updateValidation(
  id: string,
  result: ValidationResult,
  reporterTrustScore?: number
): Issue | null {
  const issues = getIssues()
  const idx = issues.findIndex((i) => i.id === id)
  if (idx === -1) return null
  issues[idx].validationResult = result
  if (reporterTrustScore !== undefined) {
    issues[idx].reporterTrustScore = reporterTrustScore
  }
  issues[idx].priorityScore = calculatePriorityScore({
    ...issues[idx],
    clusterDensity: issues[idx].reportCount * 1.5,
  })
  issues[idx].updatedAt = new Date().toISOString()
  persist(issues)
  return issues[idx]
}

export function getStats() {
  const issues = getIssues()
  return {
    total: issues.length,
    reported: issues.filter((i) => i.status === 'reported').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    highPriority: issues.filter((i) => i.priorityScore >= 7).length,
    pendingValidation: issues.filter((i) => i.validationResult === 'pending').length,
    manipulated: issues.filter((i) => i.validationResult === 'manipulated').length,
  }
}
