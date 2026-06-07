import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import type { Issue } from '../../types'
import { CATEGORY_LABELS } from '../../types'
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

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]

interface IssueMapProps {
  issues: Issue[]
  showHeatmap?: boolean
  height?: string
  center?: [number, number]
  zoom?: number
}

export function IssueMap({
  issues,
  showHeatmap = false,
  height = '400px',
  center = DEFAULT_CENTER,
  zoom = 11,
}: IssueMapProps) {
  const heatPoints: [number, number, number][] = issues.map((i) => [
    i.location.lat,
    i.location.lng,
    i.priorityScore / 10,
  ])

  return (
    <div
      className="animate-scale-in overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/5 ring-1 ring-white/5"
      style={{ height }}
    >
      <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {showHeatmap && <HeatmapLayer points={heatPoints} />}
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.location.lat, issue.location.lng]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-slate-100">{issue.title}</p>
                <p className="text-xs text-cyan-400">{CATEGORY_LABELS[issue.category]}</p>
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
