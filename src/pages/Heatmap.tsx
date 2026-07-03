import { useEffect, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { AnimatedPage } from '../components/ui/AnimatedPage'
import { IssueMap } from '../components/map/IssueMap'
import { useConfig } from '../context/ConfigContext'
import { useIssues } from '../context/IssueContext'
import { getClusters } from '../services/issueService'
import type { IssueCategory } from '../types'

interface Cluster {
  id: string
  area: string
  issueCount: number
  totalReports: number
  maxPriority: number
}

export function Heatmap() {
  const { issues, loading } = useIssues()
  const { config } = useConfig()
  const [category, setCategory] = useState<IssueCategory | 'all'>('all')
  const [clusters, setClusters] = useState<Cluster[]>([])

  const filtered =
    category === 'all' ? issues : issues.filter((i) => i.category === category)

  useEffect(() => {
    getClusters(category === 'all' ? undefined : category)
      .then(setClusters)
      .catch(console.error)
  }, [category, issues])

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Issue <span className="text-gradient">Heatmap</span>
        </h1>
        <p className="mt-1 text-slate-400">Geographic intensity and clustered problem zones.</p>

        <div className="mt-6 flex flex-wrap gap-4 animate-fade-in-up stagger-1">
          <select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory | 'all')} className="input-dark w-auto text-sm">
            <option value="all" className="bg-slate-900">All Categories</option>
            {(config?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="mt-4 text-slate-400">Loading map data...</p>
        ) : (
          <div className="mt-4">
            <IssueMap issues={filtered} showHeatmap height="500px" />
          </div>
        )}

        <div className="mt-8 animate-fade-in-up stagger-2">
          <h2 className="text-lg font-semibold text-slate-100">Clustered Issues</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clusters.map((c, i) => (
              <div key={c.id} className={`glass-card p-4 animate-fade-in-up stagger-${(i % 6) + 1}`}>
                <p className="font-medium text-slate-100">{c.area}</p>
                <p className="mt-1 text-sm text-slate-500">{c.issueCount} linked issues</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-400">{c.totalReports} total reports</span>
                  <span className="font-semibold text-red-400">Priority {c.maxPriority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  )
}
