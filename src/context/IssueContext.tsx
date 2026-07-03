import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as issueService from '../services/issueService'
import type { Issue, IssueCategory, IssueStatus, ValidationResult } from '../types'

interface Stats {
  total: number
  reported: number
  inProgress: number
  resolved: number
  highPriority: number
  pendingValidation: number
  manipulated: number
}

interface IssueContextValue {
  issues: Issue[]
  loading: boolean
  error: string | null
  refreshIssues: () => Promise<void>
  createIssue: (data: {
    title: string
    description: string
    category: IssueCategory
    severity: number
    location: Issue['location']
    imageUrl?: string
    mergeWithId?: string
  }) => Promise<Issue>
  updateStatus: (id: string, status: IssueStatus) => Promise<void>
  validateIssue: (id: string, result?: ValidationResult) => Promise<void>
  stats: Stats
}

const defaultStats: Stats = {
  total: 0,
  reported: 0,
  inProgress: 0,
  resolved: 0,
  highPriority: 0,
  pendingValidation: 0,
  manipulated: 0,
}

const IssueContext = createContext<IssueContextValue | null>(null)

export function IssueProvider({ children }: { children: ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshIssues = useCallback(async () => {
    try {
      setError(null)
      const [issuesData, statsData] = await Promise.all([
        issueService.getAllIssues(),
        issueService.getStats(),
      ])
      setIssues(issuesData)
      setStats(statsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshIssues()
  }, [refreshIssues])

  const createIssue = useCallback(
    async (data: {
      title: string
      description: string
      category: IssueCategory
      severity: number
      location: Issue['location']
      imageUrl?: string
      mergeWithId?: string
    }) => {
      const issue = await issueService.createIssue(data)
      await refreshIssues()
      return issue
    },
    [refreshIssues]
  )

  const updateStatus = useCallback(
    async (id: string, status: IssueStatus) => {
      await issueService.updateIssueStatus(id, status)
      await refreshIssues()
    },
    [refreshIssues]
  )

  const validateIssue = useCallback(
    async (id: string, result?: ValidationResult) => {
      await issueService.validateIssue(id, result)
      await refreshIssues()
    },
    [refreshIssues]
  )

  const value = useMemo(
    () => ({
      issues,
      loading,
      error,
      refreshIssues,
      createIssue,
      updateStatus,
      validateIssue,
      stats,
    }),
    [issues, loading, error, refreshIssues, createIssue, updateStatus, validateIssue, stats]
  )

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
}

export function useIssues() {
  const ctx = useContext(IssueContext)
  if (!ctx) throw new Error('useIssues must be used within IssueProvider')
  return ctx
}
