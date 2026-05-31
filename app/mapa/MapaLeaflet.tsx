"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Corrige ícones padrão do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function criarIcone(cor: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 36px; height: 36px; border-radius: 50%;
        background-color: ${cor};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function CentralizarMapa({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.setView([pos.lat, pos.lng], map.getZoom())
  }, [pos])
  return null
}

export default function MapaLeaflet({ minhaPos, localizacoes }: { minhaPos: any; localizacoes: any[] }) {
  const centro = minhaPos || { lat: -22.9068, lng: -43.1729 }

  return (
    <MapContainer
      center={[centro.lat, centro.lng]}
      zoom={15}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <CentralizarMapa pos={minhaPos} />

      {/* Marcador do usuário */}
      {minhaPos && (
        <Marker position={[minhaPos.lat, minhaPos.lng]} icon={criarIcone("#2F195F")}>
          <Popup>Você</Popup>
        </Marker>
      )}

      {/* Marcadores do círculo */}
      {localizacoes.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={criarIcone(loc.corGrupo || "#BB99FF")}
        >
          <Popup>{loc.nome || loc.nomeGrupo || "Círculo"}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}