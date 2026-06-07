import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

interface HeatmapLayerProps {
  points: [number, number, number][]
}

export function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    const layer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 14,
      gradient: {
        0.2: '#10b981',
        0.5: '#f59e0b',
        0.8: '#ef4444',
        1.0: '#7f1d1d',
      },
    }).addTo(map)

    return () => {
      map.removeLayer(layer)
    }
  }, [map, points])

  return null
}
