// src/app/(your-path)/MapComponent.tsx
"use client"

import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { LatLngTuple, LatLngBoundsExpression } from "leaflet"
import L from "leaflet"
import { useEffect } from "react"

// Fix icon
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

// Warna berdasarkan cluster (bisa berbeda per halaman, tapi kita simpan di sini untuk sementara)
export const CLUSTER_COLORS: Record<number, string> = {
  0: "#CD2C58",
  1: "#FFC400",
  2: "#4ecdc4",
  3: "#59AC77",
  4: "#9B5DE0",
  5: "#4E56C0",
}

const getClusterColor = (cluster: number | undefined): string => {
  return cluster !== undefined && CLUSTER_COLORS[cluster]
    ? CLUSTER_COLORS[cluster]
    : "#888888"
}

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: "custom-cluster-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">
        •
      </div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
  })
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || markers.length === 0) return
    const bounds = L.latLngBounds(markers.map(m => m.position))
    if (markers.length === 1) {
      map.setView(markers[0].position, 12)
    } else {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers, map])
  return null
}

export interface MapMarker {
  name: string
  position: LatLngTuple
  cluster?: number
  label?: string
  // Sisanya bebas — bisa berisi field apa saja
  [key: string]: any
}

interface MapComponentProps {
  markers: MapMarker[]
  center?: LatLngTuple
  zoom?: number
  bounds?: LatLngBoundsExpression
  renderTooltip?: (marker: MapMarker) => React.ReactNode
}

export default function MapComponent({
  markers,
  center = [-7.5, 112.5],
  zoom = 8,
  bounds = [
    [-8.8, 111.0],
    [-6.5, 114.8],
  ],
  renderTooltip,
}: MapComponentProps) {
  if (typeof window === "undefined") return null

  const uniqueClusters = Array.from(
    new Set(
      markers
        .filter(m => m.cluster !== undefined && m.label !== undefined)
        .map(m => `${m.cluster}-${m.label}`)
    )
  ).map(str => {
    const [clusterStr, label] = str.split('-', 2)
    return { cluster: Number(clusterStr), label }
  })

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={7}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitBounds markers={markers} />
        {markers.map((marker, idx) => (
          <Marker
            key={`${marker.name}-${idx}`}
            position={marker.position}
            icon={createCustomIcon(getClusterColor(marker.cluster))}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {renderTooltip ? renderTooltip(marker) : marker.name}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* LEGEND — bisa juga dipindah ke luar jika perlu */}
      {uniqueClusters.length > 0 && (
        <div
          className="absolute top-3 left-3 bg-white p-3 rounded-lg shadow-md z-[1000] max-w-[250px]"
          style={{ fontSize: '12px', lineHeight: '1.4' }}
        >
          <div className="font-bold mb-2 text-gray-800">Kluster</div>
          <div className="space-y-1">
            {uniqueClusters
              .sort((a, b) => a.cluster - b.cluster)
              .map(({ cluster, label }) => {
                const color = CLUSTER_COLORS[cluster] || "#888"
                return (
                  <div key={cluster} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-gray-700">{label}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}