import { Link } from 'react-router-dom'
import { AlertTriangle, Bot, CheckCircle, Clock, FileWarning } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { IssueCard } from '../../components/issues/IssueCard'
import { StatCard } from '../../components/ui/StatCard'
import { useIssues } from '../../context/IssueContext'

export function AdminDashboard() {
  const { issues, stats } = useIssues()
  const topPriority = issues.filter((i) => i.status !== 'resolved').slice(0, 5)

  return (
    <Layout>
      <AnimatedPage>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Admin <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-slate-400">Manage prioritized issues, assign tasks, and validate evidence.</p>
          </div>
          <Link to="/admin/validation" className="btn-primary">
            <Bot className="h-5 w-5" />
            AI Validation
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Issues" value={stats.total} icon={FileWarning} delay={50} />
          <StatCard label="Reported" value={stats.reported} icon={Clock} accent="amber" delay={100} />
          <StatCard label="In Progress" value={stats.inProgress} icon={AlertTriangle} accent="blue" delay={150} />
          <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle} accent="emerald" delay={200} />
          <StatCard label="High Priority" value={stats.highPriority} icon={AlertTriangle} accent="red" delay={250} />
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

          <div className="space-y-4 animate-fade-in-up stagger-3">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-100">Pending Validation</h3>
              <p className="mt-2 text-3xl font-bold text-amber-400">{stats.pendingValidation}</p>
              <p className="text-sm text-slate-500">Issues awaiting AI morph detection</p>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 backdrop-blur-sm">
              <h3 className="font-semibold text-red-300">Manipulated Reports</h3>
              <p className="mt-2 text-3xl font-bold text-red-400">{stats.manipulated}</p>
              <p className="text-sm text-red-300/70">Trust scores deprioritized</p>
            </div>
            <Link
              to="/admin/issues"
              className="btn-ghost block w-full py-3 text-center text-cyan-400 hover:text-cyan-300"
            >
              View All Issues →
            </Link>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  )
}
