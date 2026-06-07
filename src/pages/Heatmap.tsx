import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { AnimatedPage } from '../components/ui/AnimatedPage'
import { IssueMap } from '../components/map/IssueMap'
import { useIssues } from '../context/IssueContext'
import { CATEGORY_LABELS, type IssueCategory } from '../types'

export function Heatmap() {
  const { issues } = useIssues()
  const [category, setCategory] = useState<IssueCategory | 'all'>('all')
  const [showClusters, setShowClusters] = useState(true)

  const filtered =
    category === 'all' ? issues : issues.filter((i) => i.category === category)

  const clusters = new Map<string, typeof issues>()
  filtered.forEach((i) => {
    const key = i.clusterId || i.id
    if (!clusters.has(key)) clusters.set(key, [])
    clusters.get(key)!.push(i)
  })

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Issue <span className="text-gradient">Heatmap</span>
        </h1>
        <p className="mt-1 text-slate-400">
          Geographic intensity visualization for high-risk zones and clustered issues.
        </p>

        <div className="mt-6 flex flex-wrap gap-4 animate-fade-in-up stagger-1">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IssueCategory | 'all')}
            className="input-dark w-auto text-sm"
          >
            <option value="all" className="bg-slate-900">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-slate-900">
                {v}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input
              type="checkbox"
              checked={showClusters}
              onChange={(e) => setShowClusters(e.target.checked)}
              className="accent-cyan-500"
            />
            Show cluster info
          </label>
        </div>

        <div className="mt-4">
          <IssueMap issues={filtered} showHeatmap height="500px" />
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-slate-500 animate-fade-in">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" /> Low intensity
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" /> High risk
          </span>
        </div>

        {showClusters && (
          <div className="mt-8 animate-fade-in-up stagger-2">
            <h2 className="text-lg font-semibold text-slate-100">Clustered Issues</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...clusters.entries()].map(([id, items], i) => {
                const totalReports = items.reduce((s, i) => s + i.reportCount, 0)
                const maxPriority = Math.max(...items.map((i) => i.priorityScore))
                return (
                  <div
                    key={id}
                    className={`glass-card p-4 animate-fade-in-up stagger-${(i % 6) + 1}`}
                  >
                    <p className="font-medium text-slate-100">{items[0].location.address}</p>
                    <p className="mt-1 text-sm text-slate-500">{items.length} linked issues</p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-slate-400">{totalReports} total reports</span>
                      <span className="font-semibold text-red-400">Priority {maxPriority}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </AnimatedPage>
    </Layout>
  )
}
