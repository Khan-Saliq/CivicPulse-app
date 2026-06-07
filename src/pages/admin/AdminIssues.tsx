import { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { IssueCard } from '../../components/issues/IssueCard'
import { useIssues } from '../../context/IssueContext'
import { STATUS_LABELS, type IssueStatus } from '../../types'

export function AdminIssues() {
  const { issues } = useIssues()
  const [statusFilter, setStatusFilter] = useState<IssueStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority')

  let filtered = statusFilter === 'all' ? issues : issues.filter((i) => i.status === statusFilter)

  if (sortBy === 'date') {
    filtered = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Issue <span className="text-gradient">Management</span>
        </h1>
        <p className="mt-1 text-slate-400">Review, assign, and update civic issues by priority.</p>

        <div className="mt-6 flex flex-wrap gap-3 animate-fade-in-up stagger-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as IssueStatus | 'all')}
            className="input-dark w-auto text-sm"
          >
            <option value="all" className="bg-slate-900">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-slate-900">
                {v}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'date')}
            className="input-dark w-auto text-sm"
          >
            <option value="priority" className="bg-slate-900">Sort by Priority</option>
            <option value="date" className="bg-slate-900">Sort by Date</option>
          </select>
        </div>

        <div className="mt-6 space-y-4">
          {filtered.map((issue, i) => (
            <IssueCard key={issue.id} issue={issue} adminLink delay={i * 50} />
          ))}
        </div>
      </AnimatedPage>
    </Layout>
  )
}
