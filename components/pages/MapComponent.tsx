"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { LatLngTuple } from "leaflet"
import L from "leaflet"

// Fix ikon marker
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

export default function MapComponent() {
  const mapRef = useRef<any>(null)
  const center: LatLngTuple = [-7.2575, 112.7521]

  const villages: { name: string; position: LatLngTuple }[] = [
    { name: "Desa A", position: [-7.2, 112.7] },
    { name: "Desa B", position: [-7.3, 112.8] },
    { name: "Desa C", position: [-7.1, 112.6] },
  ]

  useEffect(() => {
    if (mapRef.current) {
      console.log("Map component unmounted")
    }
  }, [])

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={8}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg z-50"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {villages.map((village, idx) => (
        <Marker key={idx} position={village.position}>
          <Popup>{village.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}