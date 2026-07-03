import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bot, CheckCircle, Clock, FileWarning } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { IssueCard } from '../../components/issues/IssueCard'
import { StatCard } from '../../components/ui/StatCard'
import { useIssues } from '../../context/IssueContext'
import { useConfig } from '../../context/ConfigContext'
import { getAllIssues, getStats } from '../../services/issueService'
import { clearAllUploadsAndIssues } from '../../services/uploadService'
import { promoteToAdmin } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import type { Issue } from '../../types'

export function AdminDashboard() {
  const { stats, loading, error, refreshIssues } = useIssues()
  const { user } = useAuth()
  const { config } = useConfig()
  const [topPriority, setTopPriority] = useState<Issue[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [departmentStats, setDepartmentStats] = useState(stats)
  const [adminRole, setAdminRole] = useState<'admin' | 'department_admin'>('admin')
  const [departmentToPromote, setDepartmentToPromote] = useState('')
  const [emailToPromote, setEmailToPromote] = useState('')
  const [promotionMessage, setPromotionMessage] = useState<string | null>(null)
  const [promotionError, setPromotionError] = useState<string | null>(null)
  const [promoting, setPromoting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearMessage, setClearMessage] = useState<string | null>(null)
  const [clearError, setClearError] = useState<string | null>(null)

  const departments = useMemo(() => {
    const items = config?.categories.map((category) => category.department ?? '') ?? []
    return Array.from(new Set(items.filter(Boolean)))
  }, [config])

  useEffect(() => {
    if (user?.role === 'department_admin') {
      setSelectedDepartment(user.department || 'all')
    }
  }, [user])

  useEffect(() => {
    const params: Record<string, string> = { limit: '5', excludeResolved: 'true' }
    if (selectedDepartment && selectedDepartment !== 'all') {
      params.department = selectedDepartment
    }

    getAllIssues(params).then(setTopPriority).catch(console.error)
  }, [stats, selectedDepartment])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const params: Record<string, string> = {}
        if (user?.role === 'department_admin') {
          params.department = user.department || ''
        } else if (selectedDepartment && selectedDepartment !== 'all') {
          params.department = selectedDepartment
        }
        const statsData = await getStats(params)
        setDepartmentStats(statsData)
      } catch (err) {
        console.error(err)
      }
    }

    loadStats()
  }, [user, selectedDepartment])

  return (
    <Layout>
      <AnimatedPage>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-slate-400">Manage prioritized issues and validate evidence.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                setClearMessage(null)
                setClearError(null)
                if (!window.confirm('Delete all issues, upload records, and related DB info? This cannot be undone.')) return
                setClearing(true)
                try {
                  await clearAllUploadsAndIssues()
                  await refreshIssues()
                  setClearMessage('All issues and uploads were cleared successfully.')
                } catch (err) {
                  setClearError((err as Error).message)
                } finally {
                  setClearing(false)
                }
              }}
              disabled={clearing}
              className="btn-ghost rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
            >
              {clearing ? 'Clearing...' : 'Clear All Issues'}
            </button>
            <Link to="/admin/validation" className="btn-primary">
              <Bot className="h-5 w-5" /> AI Validation
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 text-red-300">{error}</div>}
        {clearError && <div className="mb-4 text-red-300">{clearError}</div>}
        {clearMessage && <div className="mb-4 text-emerald-300">{clearMessage}</div>}

        {loading ? (
          <p className="text-slate-400">Loading dashboard...</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-slate-300">Department View:</span>
              {user?.role === 'admin' ? (
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="input-dark w-auto text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-cyan-200">
                  {user?.department || 'Unknown Department'}
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Total Issues" value={departmentStats.total} icon={FileWarning} delay={50} />
              <StatCard label="Reported" value={departmentStats.reported} icon={Clock} accent="amber" delay={100} />
              <StatCard label="In Progress" value={departmentStats.inProgress} icon={AlertTriangle} accent="blue" delay={150} />
              <StatCard label="Resolved" value={departmentStats.resolved} icon={CheckCircle} accent="emerald" delay={200} />
              <StatCard label="High Priority" value={departmentStats.highPriority} icon={AlertTriangle} accent="red" delay={250} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-lg font-semibold text-slate-100">Prioritized Issues</h2>
                <div className="space-y-4">
                  {topPriority.map((issue, i) => (
                    <IssueCard key={issue.id} issue={issue} adminLink delay={i * 80} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-100">Pending Validation</h3>
                  <p className="mt-2 text-3xl font-bold text-amber-400">{departmentStats.pendingValidation}</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
                  <h3 className="font-semibold text-red-300">Manipulated Reports</h3>
                  <p className="mt-2 text-3xl font-bold text-red-400">{departmentStats.manipulated}</p>
                </div>
                <Link to="/admin/issues" className="btn-ghost block w-full py-3 text-center text-cyan-400">
                  View All Issues →
                </Link>
              </div>
            </div>

            <div className="mt-8 glass-card p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-100">Promote User to Admin</h2>
              <p className="text-slate-400">Enter an existing citizen email address to assign admin rights.</p>
              <div className="mt-4 space-y-3">
                <input
                  type="email"
                  value={emailToPromote}
                  onChange={(e) => setEmailToPromote(e.target.value)}
                  placeholder="user@example.com"
                  className="input-dark w-full text-sm"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value as 'admin' | 'department_admin')}
                    className="input-dark w-full text-sm"
                  >
                    <option value="admin">Global Admin</option>
                    <option value="department_admin">Department Admin</option>
                  </select>
                  <select
                    value={departmentToPromote}
                    onChange={(e) => setDepartmentToPromote(e.target.value)}
                    disabled={adminRole !== 'department_admin'}
                    className="input-dark w-full text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={async () => {
                    setPromotionMessage(null)
                    setPromotionError(null)
                    setPromoting(true)
                    try {
                      const promotedUser = await promoteToAdmin(
                        emailToPromote.trim(),
                        adminRole,
                        adminRole === 'department_admin' ? departmentToPromote : undefined
                      )
                      setPromotionMessage(
                        `${promotedUser.name} is now ${promotedUser.role === 'admin' ? 'a global admin' : `a department admin for ${promotedUser.department}`}`
                      )
                      setEmailToPromote('')
                      setDepartmentToPromote('')
                    } catch (err) {
                      setPromotionError((err as Error).message)
                    } finally {
                      setPromoting(false)
                    }
                  }}
                  disabled={!emailToPromote.trim() || (adminRole === 'department_admin' && !departmentToPromote) || promoting}
                  className="btn-primary w-full py-3 text-sm disabled:opacity-50"
                >
                  Promote User
                </button>
                {promotionMessage && <p className="text-sm text-emerald-300">{promotionMessage}</p>}
                {promotionError && <p className="text-sm text-red-300">{promotionError}</p>}
              </div>
            </div>
          </>
        )}
      </AnimatedPage>
    </Layout>
  )
}
