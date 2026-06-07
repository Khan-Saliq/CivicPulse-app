import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as issueService from '../services/issueService'
import type { Issue, IssueCategory, IssueStatus, ValidationResult } from '../types'

interface IssueContextValue {
  issues: Issue[]
  refreshIssues: () => void
  createIssue: (data: Parameters<typeof issueService.createIssue>[0]) => Issue
  updateStatus: (id: string, status: IssueStatus, assignedTo?: string) => void
  updateValidation: (id: string, result: ValidationResult, trustScore?: number) => void
  stats: ReturnType<typeof issueService.getStats>
}

const IssueContext = createContext<IssueContextValue | null>(null)

export function IssueProvider({ children }: { children: ReactNode }) {
  const [issues, setIssues] = useState<Issue[]>(() => issueService.getAllIssues())

  const refreshIssues = useCallback(() => {
    setIssues(issueService.getAllIssues())
  }, [])

  const createIssue = useCallback(
    (data: {
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
    }) => {
      const issue = issueService.createIssue(data)
      refreshIssues()
      return issue
    },
    [refreshIssues]
  )

  const updateStatus = useCallback(
    (id: string, status: IssueStatus, assignedTo?: string) => {
      issueService.updateIssueStatus(id, status, assignedTo)
      refreshIssues()
    },
    [refreshIssues]
  )

  const updateValidation = useCallback(
    (id: string, result: ValidationResult, trustScore?: number) => {
      issueService.updateValidation(id, result, trustScore)
      refreshIssues()
    },
    [refreshIssues]
  )

  const stats = useMemo(() => issueService.getStats(), [issues])

  const value = useMemo(
    () => ({ issues, refreshIssues, createIssue, updateStatus, updateValidation, stats }),
    [issues, refreshIssues, createIssue, updateStatus, updateValidation, stats]
  )

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>
}

export function useIssues() {
  const ctx = useContext(IssueContext)
  if (!ctx) throw new Error('useIssues must be used within IssueProvider')
  return ctx
}
