import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { AnimatedPage } from '../../components/ui/AnimatedPage'
import { IssueCard } from '../../components/issues/IssueCard'
import { IssueMap } from '../../components/map/IssueMap'
import { useGeolocation } from '../../hooks/useGeolocation'
import { getNearbyIssues } from '../../services/issueService'
import type { Issue } from '../../types'

export function NearbyIssues() {
  const geo = useGeolocation()
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [radius, setRadius] = useState(10)
  const [nearby, setNearby] = useState<Issue[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (geo.lat != null && geo.lng != null && lat === null) {
      setLat(geo.lat)
      setLng(geo.lng)
    }
  }, [geo.lat, geo.lng, lat])

  useEffect(() => {
    if (lat == null || lng == null) return
    setLoading(true)
    getNearbyIssues(lat, lng, radius)
      .then(setNearby)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [lat, lng, radius])

  return (
    <Layout>
      <AnimatedPage>
        <h1 className="text-2xl font-bold text-slate-100">
          Nearby <span className="text-gradient">Issues</span>
        </h1>
        <p className="mt-1 text-slate-400">View and vote on issues in your area.</p>

        {geo.loading && <p className="mt-2 text-sm text-slate-500">Detecting location...</p>}

        <div className="glass-card mt-6 grid gap-4 p-4 sm:grid-cols-3 animate-fade-in-up stagger-1">
          <div>
            <label className="text-sm text-slate-500">Latitude</label>
            <input type="number" step="0.0001" value={lat ?? ''} onChange={(e) => setLat(Number(e.target.value))} className="input-dark mt-1 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-500">Longitude</label>
            <input type="number" step="0.0001" value={lng ?? ''} onChange={(e) => setLng(Number(e.target.value))} className="input-dark mt-1 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-500">Radius: <span className="text-cyan-400">{radius} km</span></label>
            <input type="range" min={1} max={25} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="mt-2 w-full accent-cyan-500" />
          </div>
        </div>

        <div className="mt-6">
          <IssueMap issues={nearby} center={lat != null && lng != null ? [lat, lng] : null} height="350px" />
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-slate-400">Searching nearby issues...</p>
          ) : lat == null || lng == null ? (
            <p className="text-slate-400">Set your location to find nearby issues.</p>
          ) : (
            <>
              <h2 className="font-semibold text-slate-100">
                <span className="text-gradient">{nearby.length}</span> issues found
              </h2>
              {nearby.map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} delay={i * 60} />
              ))}
            </>
          )}
        </div>
      </AnimatedPage>
    </Layout>
  )
}
