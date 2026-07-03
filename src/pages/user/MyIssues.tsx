import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { IssueCard } from '../../components/issues/IssueCard'
import { useAuth } from '../../context/AuthContext'
import { getIssuesByReporter } from '../../services/issueService'
import type { Issue } from '../../types'

export function MyIssues() {
  const { user } = useAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getIssuesByReporter(user.id)
      .then(setIssues)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          My <span className="text-gradient">Issues</span>
        </h1>
        <p className="mt-1 text-slate-400">Track status and priority of your submitted reports.</p>

        {loading ? (
          <p className="mt-8 text-slate-400">Loading your issues...</p>
        ) : issues.length === 0 ? (
          <div className="glass-card mt-8 animate-scale-in p-12 text-center">
            <p className="text-slate-400">You haven&apos;t reported any issues yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {issues.map((issue, i) => (
              <div key={issue.id} id={issue.id}>
                <IssueCard issue={issue} delay={i * 80} />
              </div>
            ))}
          </div>
        )}
      </AnimatedPage>
    </Layout>
  )
}
