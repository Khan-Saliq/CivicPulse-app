import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import type { Issue } from '../../types'
import { useConfig } from '../../context/ConfigContext'
import { HeatmapLayer } from './HeatmapLayer'
import 'leaflet/dist/leaflet.css'

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface IssueMapProps {
  issues: Issue[]
  showHeatmap?: boolean
  height?: string
  center?: [number, number] | null
  zoom?: number
}

export function IssueMap({
  issues,
  showHeatmap = false,
  height = '400px',
  center,
  zoom = 11,
}: IssueMapProps) {
  const { config } = useConfig()
  const mapCenter: [number, number] =
    center ??
    (issues[0]
      ? [issues[0].location.lat, issues[0].location.lng]
      : [20.5937, 78.9629])

  const heatPoints: [number, number, number][] = issues.map((i) => [
    i.location.lat,
    i.location.lng,
    i.priorityScore / (config?.highPriorityThreshold ?? 10),
  ])

  if (center === null) {
    return (
      <div
        className="flex animate-scale-in items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400"
        style={{ height }}
      >
        Waiting for location...
      </div>
    )
  }

  return (
    <div
      className="animate-scale-in overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/5 ring-1 ring-white/5"
      style={{ height }}
    >
      <MapContainer center={mapCenter} zoom={zoom} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {showHeatmap && <HeatmapLayer points={heatPoints} />}
        {issues.map((issue) => (
          <Marker key={issue.id} position={[issue.location.lat, issue.location.lng]} icon={icon}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-slate-100">{issue.title}</p>
                <p className="text-xs text-cyan-400">
                  {config?.categories.find((c) => c.id === issue.category)?.label ?? issue.category}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Priority: <strong className="text-violet-400">{issue.priorityScore}</strong>
                </p>
                <p className="text-xs text-slate-500">{issue.location.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
