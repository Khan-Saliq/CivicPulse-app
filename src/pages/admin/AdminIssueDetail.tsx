import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { PriorityBar } from '../../components/ui/PriorityBar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TrustScore } from '../../components/ui/TrustScore'
import { Badge } from '../../components/ui/Badge'
import { useIssues } from '../../context/IssueContext'
import { updateUserTrust } from '../../services/authService'
import { CATEGORY_LABELS, type IssueStatus } from '../../types'

export function AdminIssueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { issues, updateStatus, updateValidation } = useIssues()
  const issue = issues.find((i) => i.id === id)

  if (!issue) {
    return (
      <Layout>
        <p className="text-slate-400">Issue not found.</p>
      </Layout>
    )
  }

  const handleStatusChange = (status: IssueStatus) => {
    const assignedTo =
      status === 'in_progress'
        ? 'Field Team ' + String.fromCharCode(65 + Math.floor(Math.random() * 3))
        : undefined
    updateStatus(issue.id, status, assignedTo)
  }

  const handleValidation = (result: 'valid' | 'suspicious' | 'manipulated') => {
    let trustDelta = 0
    if (result === 'valid') trustDelta = 5
    if (result === 'suspicious') trustDelta = -3
    if (result === 'manipulated') trustDelta = -15

    const newTrust = Math.max(0, Math.min(100, issue.reporterTrustScore + trustDelta))
    updateUserTrust(issue.reporterId, trustDelta)
    updateValidation(issue.id, result, newTrust)
  }

  const validationVariant =
    issue.validationResult === 'valid'
      ? 'green'
      : issue.validationResult === 'manipulated'
        ? 'red'
        : 'amber'

  return (
    <Layout>
      <AnimatedPage>
        <button
          onClick={() => navigate('/admin/issues')}
          className="mb-4 flex items-center gap-1 text-sm text-slate-400 transition hover:text-cyan-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to issues
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="glass-card p-6 animate-scale-in">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="teal">{CATEGORY_LABELS[issue.category]}</Badge>
                <StatusBadge status={issue.status} />
                <Badge variant={validationVariant}>{issue.validationResult}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-100">{issue.title}</h1>
              <p className="mt-3 text-slate-400">{issue.description}</p>

              {issue.imageUrl && (
                <img
                  src={issue.imageUrl}
                  alt="Evidence"
                  className="mt-4 max-h-64 rounded-xl object-cover ring-2 ring-white/10 transition hover:ring-cyan-500/30"
                />
              )}

              <div className="mt-4 text-sm text-slate-500">
                <p>{issue.location.address}</p>
                <p className="mt-1 font-mono text-xs text-slate-600">
                  {issue.location.lat.toFixed(4)}, {issue.location.lng.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="glass-card p-6 animate-fade-in-up stagger-1">
              <h2 className="font-semibold text-slate-100">Update Status</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['reported', 'in_progress', 'resolved'] as IssueStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      issue.status === s
                        ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'border border-white/10 bg-white/5 text-slate-400 hover:border-cyan-500/30 hover:text-cyan-300'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {issue.assignedTo && (
                <p className="mt-3 text-sm text-slate-500">
                  Assigned to: <span className="text-violet-400">{issue.assignedTo}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5 animate-fade-in-up stagger-2">
              <h3 className="text-sm text-slate-500">Priority Score</h3>
              <div className="mt-2">
                <PriorityBar score={issue.priorityScore} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Severity</p>
                  <p className="font-semibold text-slate-100">{issue.severity}/5</p>
                </div>
                <div>
                  <p className="text-slate-500">Reports</p>
                  <p className="font-semibold text-slate-100">{issue.reportCount}</p>
                </div>
                <div>
                  <p className="text-slate-500">Votes</p>
                  <p className="font-semibold text-slate-100">{issue.votes}</p>
                </div>
                <div>
                  <p className="text-slate-500">Cluster</p>
                  <p className="font-semibold text-slate-100">{issue.clusterId || '—'}</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 animate-fade-in-up stagger-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-violet-400" />
                <span className="font-medium text-slate-100">{issue.reporterName}</span>
              </div>
              <div className="mt-3">
                <TrustScore score={issue.reporterTrustScore} />
              </div>
            </div>

            <div className="glass-card p-5 animate-fade-in-up stagger-4">
              <h3 className="font-semibold text-slate-100">Quick Validation</h3>
              <p className="mt-1 text-sm text-slate-500">Or use AI chatbot for morph detection</p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => handleValidation('valid')}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  Mark Valid
                </button>
                <button
                  onClick={() => handleValidation('suspicious')}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
                >
                  Mark Suspicious
                </button>
                <button
                  onClick={() => handleValidation('manipulated')}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Mark Manipulated
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  )
}
