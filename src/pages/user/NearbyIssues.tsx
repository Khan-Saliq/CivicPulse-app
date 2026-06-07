import { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { IssueCard } from '../../components/issues/IssueCard'
import { IssueMap } from '../../components/map/IssueMap'
import { getNearbyIssues } from '../../services/issueService'

export function NearbyIssues() {
  const [lat, setLat] = useState(28.6139)
  const [lng, setLng] = useState(77.209)
  const [radius, setRadius] = useState(10)

  const nearby = getNearbyIssues(lat, lng, radius).filter((i) => i.status !== 'resolved')

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Nearby <span className="text-gradient">Issues</span>
        </h1>
        <p className="mt-1 text-slate-400">View and vote on issues in your area.</p>

        <div className="glass-card mt-6 grid gap-4 p-4 sm:grid-cols-3 animate-fade-in-up stagger-1">
          <div>
            <label className="text-sm text-slate-500">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="input-dark mt-1 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className="input-dark mt-1 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500">
              Radius: <span className="text-cyan-400">{radius} km</span>
            </label>
            <input
              type="range"
              min={1}
              max={25}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="mt-2 w-full accent-cyan-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <IssueMap issues={nearby} center={[lat, lng]} height="350px" />
        </div>

        <div className="mt-6 space-y-4">
          <h2 className="font-semibold text-slate-100">
            <span className="text-gradient">{nearby.length}</span> issues found
          </h2>
          {nearby.map((issue, i) => (
            <IssueCard key={issue.id} issue={issue} delay={i * 60} />
          ))}
        </div>
      </AnimatedPage>
    </Layout>
  )
}
