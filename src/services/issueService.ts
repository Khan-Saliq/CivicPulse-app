import { apiFetch } from './api'
import type { Issue, IssueCategory, IssueStatus, ValidationResult } from '../types'

export async function exportIssues(filters: Record<string, any>): Promise<Blob> {
  const token = localStorage.getItem('civicpulse_token')
  const response = await fetch('/api/issues/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filters }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to export issues')
  }
  
  return response.blob()
}

export async function getAllIssues(params?: Record<string, string>): Promise<Issue[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<Issue[]>(`/issues${qs}`)
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  try {
    return await apiFetch<Issue>(`/issues/${id}`)
  } catch {
    return undefined
  }
}

export async function getIssuesByReporter(reporterId: string): Promise<Issue[]> {
  return apiFetch<Issue[]>(`/issues/reporter/${reporterId}`)
}

export async function getReporterStats(reporterId: string) {
  return apiFetch<{
    total: number
    reported: number
    inProgress: number
    resolved: number
  }>(`/issues/reporter/${reporterId}/stats`)
}

export async function getNearbyIssues(
  lat: number,
  lng: number,
  radiusKm = 5,
  excludeResolved = true
): Promise<Issue[]> {
  return apiFetch<Issue[]>(
    `/issues/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}&excludeResolved=${excludeResolved}`
  )
}

export async function getPriorityTop(lat?: number, lng?: number, limit = 3): Promise<Issue[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (lat != null && lng != null) {
    params.set('lat', String(lat))
    params.set('lng', String(lng))
  }
  return apiFetch<Issue[]>(`/issues/priority/top?${params}`)
}

export async function getClusters(category?: string) {
  const qs = category && category !== 'all' ? `?category=${category}` : ''
  return apiFetch<
    {
      id: string
      area: string
      issueCount: number
      totalReports: number
      maxPriority: number
      categories: string[]
    }[]
  >(`/issues/clusters${qs}`)
}

export async function findDuplicateCandidates(
  title: string,
  lat: number,
  lng: number
): Promise<Issue[]> {
  return apiFetch<Issue[]>(
    `/issues/duplicates?title=${encodeURIComponent(title)}&lat=${lat}&lng=${lng}`
  )
}

export async function createIssue(data: {
  title: string
  description: string
  category: IssueCategory
  severity: number
  location: Issue['location']
  imageUrl?: string
  mergeWithId?: string
}): Promise<Issue> {
  return apiFetch<Issue>('/issues', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function voteIssue(id: string): Promise<Issue> {
  return apiFetch<Issue>(`/issues/${id}/vote`, { method: 'POST' })
}

export async function updateIssueStatus(id: string, status: IssueStatus): Promise<Issue> {
  return apiFetch<Issue>(`/issues/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function validateIssue(id: string, result?: ValidationResult) {
  return apiFetch<{
    issue: Issue
    result: ValidationResult
    confidence: number
    user: { id: string; trustScore: number } | null
  }>(`/issues/${id}/validate`, {
    method: 'POST',
    body: JSON.stringify(result ? { result } : {}),
  })
}

export async function getStats(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<{
    total: number
    reported: number
    inProgress: number
    resolved: number
    highPriority: number
    pendingValidation: number
    manipulated: number
  }>(`/issues/stats${qs}`)
}
