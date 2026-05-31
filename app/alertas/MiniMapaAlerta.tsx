"use client"

import { MapContainer, TileLayer, Marker } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const iconeVermelho = L.divIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:#ef4444;border:3px solid white;
    box-shadow:0 2px 8px rgba(239,68,68,0.5);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

export default function MiniMapaAlerta({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ width: "100%", height: "130px", borderRadius: "12px", zIndex: 1 }}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={iconeVermelho} />
    </MapContainer>
  )
}