import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { PriorityBar } from '../../components/ui/PriorityBar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { TrustScore } from '../../components/ui/TrustScore'
import { Badge } from '../../components/ui/Badge'
import { useConfig } from '../../context/ConfigContext'
import { fixImageUrl } from '../../services/api'
import { useIssues } from '../../context/IssueContext'
import { useAuth } from '../../context/AuthContext'
import type { IssueStatus, ValidationResult } from '../../types'

export function AdminIssueDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { config } = useConfig()
  const { user, refreshSession } = useAuth()
  const { issues, updateStatus, validateIssue } = useIssues()
  const [downloading, setDownloading] = useState(false)
  const issue = issues.find((i) => i.id === id)

  if (user?.role === 'department_admin' && issue && issue.responsibleDepartment !== user.department) {
    return (
      <Layout>
        <p className="text-slate-400">You do not have access to view this issue.</p>
      </Layout>
    )
  }

  const downloadProofImage = async () => {
    if (!issue?.imageUrl) return

    try {
      setDownloading(true)
      const response = await fetch(issue.imageUrl)
      if (!response.ok) throw new Error('Failed to download proof image')
      const blob = await response.blob()
      const fileName = issue.imageUrl.split('/').pop()?.split('?')[0] || `proof-${issue.id}.jpg`
      const blobUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error(error)
      window.alert('Unable to download the proof image. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (!issue) {
    return (
      <Layout>
        <p className="text-slate-400">Issue not found.</p>
      </Layout>
    )
  }

  const categoryLabel = config?.categories.find((c) => c.id === issue.category)?.label ?? issue.category

  const handleStatusChange = async (status: IssueStatus) => {
    await updateStatus(issue.id, status)
  }

  const handleValidation = async (result: ValidationResult) => {
    await validateIssue(issue.id, result)
    await refreshSession()
  }

  const validationVariant =
    issue.validationResult === 'valid' ? 'green' : issue.validationResult === 'manipulated' ? 'red' : 'amber'

  return (
    <Layout>
      <AnimatedPage>
        <button onClick={() => navigate('/admin/issues')} className="mb-4 flex items-center gap-1 text-sm text-slate-400 transition hover:text-cyan-400">
          <ArrowLeft className="h-4 w-4" /> Back to issues
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="glass-card p-6 animate-scale-in">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="teal">{categoryLabel}</Badge>
                <StatusBadge status={issue.status} />
                <Badge variant={validationVariant}>{issue.validationResult}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-100">{issue.title}</h1>
              <p className="mt-3 text-slate-400">{issue.description}</p>
              {issue.imageUrl && (
                <div className="mt-4 space-y-3">
                  <img src={fixImageUrl(issue.imageUrl)} alt="Evidence" className="max-h-64 w-full rounded-xl object-cover ring-2 ring-white/10" />
                  <button
                    type="button"
                    onClick={downloadProofImage}
                    disabled={downloading}
                    className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloading ? 'Downloading...' : 'Download Proof Image'}
                  </button>
                </div>
              )}
              <div className="mt-4 text-sm text-slate-500 space-y-2">
                <p>{issue.location.address}</p>
                {issue.responsibleDepartment && (
                  <p>Responsible Department: <span className="text-cyan-300">{issue.responsibleDepartment}</span></p>
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-semibold text-slate-100">Update Status</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['reported', 'in_progress', 'resolved'] as IssueStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      issue.status === s
                        ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white'
                        : 'border border-white/10 bg-white/5 text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    {config?.statuses.find((x) => x.id === s)?.label ?? s}
                  </button>
                ))}
              </div>
              {issue.assignedTo && <p className="mt-3 text-sm text-slate-500">Assigned to: <span className="text-violet-400">{issue.assignedTo}</span></p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm text-slate-500">Priority Score</h3>
              <div className="mt-2"><PriorityBar score={issue.priorityScore} /></div>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-violet-400" />
                <span className="font-medium text-slate-100">{issue.reporterName}</span>
              </div>
              <div className="mt-3"><TrustScore score={issue.reporterTrustScore} /></div>
            </div>
            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-100">Admin Validation</h3>
              <p className="mt-2 text-sm text-slate-500">Accept or reject the report based on the evidence and validation status.</p>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={() => handleValidation('valid')}
                  className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  Accept Report
                </button>
                <button
                  onClick={() => handleValidation('manipulated')}
                  className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/25"
                >
                  Reject Report
                </button>
                <button
                  onClick={() => handleValidation('suspicious')}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
                >
                  Mark Suspicious
                </button>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  )
}
