import { Link } from 'react-router-dom'
import { AlertTriangle, FilePlus, MapPin, TrendingUp } from 'lucide-react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { Chatbot } from '../../components/chat/Chatbot'
import { IssueCard } from '../../components/issues/IssueCard'
import { StatCard } from '../../components/ui/StatCard'
import { TrustScore } from '../../components/ui/TrustScore'
import { CHATBOT_SUGGESTIONS } from '../../data/mockData'
import { useAuth } from '../../context/AuthContext'
import { useIssues } from '../../context/IssueContext'
import { getIssuesByReporter } from '../../services/issueService'

export function UserDashboard() {
  const { user } = useAuth()
  const { issues } = useIssues()
  const myIssues = user ? getIssuesByReporter(user.id) : []
  const nearby = issues.filter((i) => i.status !== 'resolved').slice(0, 3)

  return (
    <Layout>
      <AnimatedPage>
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Welcome, <span className="text-gradient">{user?.name}</span>
            </h1>
            <p className="text-slate-400">Report issues, track progress, and explore nearby problems.</p>
          </div>
          <TrustScore score={user?.trustScore ?? 0} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Reports" value={myIssues.length} icon={FilePlus} delay={50} />
          <StatCard label="Active Nearby" value={nearby.length} icon={MapPin} accent="amber" delay={100} />
          <StatCard
            label="In Progress"
            value={myIssues.filter((i) => i.status === 'in_progress').length}
            icon={TrendingUp}
            accent="blue"
            delay={150}
          />
          <StatCard
            label="Resolved"
            value={myIssues.filter((i) => i.status === 'resolved').length}
            icon={AlertTriangle}
            accent="emerald"
            delay={200}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">High Priority Nearby</h2>
              <Link to="/nearby" className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {nearby.map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} delay={i * 80} />
              ))}
            </div>
          </div>

          <div className="animate-fade-in-up stagger-3">
            <Chatbot issues={issues} suggestions={CHATBOT_SUGGESTIONS} />
            <Link to="/report" className="btn-primary mt-4 w-full py-3">
              <FilePlus className="h-5 w-5" />
              Report New Issue
            </Link>
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  )
}
