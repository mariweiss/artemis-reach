"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

function criarIconeMeu() {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:#2F195F;border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div style="
          background:white;padding:2px 8px;border-radius:10px;
          font-size:11px;font-weight:700;color:#2F195F;
          box-shadow:0 1px 4px rgba(0,0,0,0.15);white-space:nowrap;
        ">Você</div>
      </div>
    `,
    iconSize: [60, 56],
    iconAnchor: [30, 18],
  })
}

function criarIconeCirculo(cor: string, nome: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="
          width:36px;height:36px;border-radius:50%;
          background:${cor};border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.2);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div style="
          background:white;padding:2px 8px;border-radius:10px;
          font-size:11px;font-weight:700;color:#2F195F;
          box-shadow:0 1px 4px rgba(0,0,0,0.15);white-space:nowrap;
        ">${nome}</div>
      </div>
    `,
    iconSize: [80, 56],
    iconAnchor: [40, 18],
  })
}

function CentralizarMapa({ pos, ativo }: { pos: { lat: number; lng: number } | null, ativo: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (pos && ativo) map.setView([pos.lat, pos.lng], map.getZoom())
  }, [ativo])
  return null
}

export default function MapaLeaflet({ minhaPos, localizacoes, centralizar }: { minhaPos: any; localizacoes: any[]; centralizar: boolean }) {
  const centro = minhaPos || { lat: -22.9068, lng: -43.1729 }

  return (
    <MapContainer
      key={`${centro.lat}-${centro.lng}`}
      center={[centro.lat, centro.lng]}
      zoom={15}
      style={{ width: "100%", height: "100%", zIndex: 0 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <CentralizarMapa pos={minhaPos} ativo={centralizar} />

      {minhaPos && (
        <Marker position={[minhaPos.lat, minhaPos.lng]} icon={criarIconeMeu()} />
      )}

      {localizacoes.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={criarIconeCirculo(
            loc.corGrupo || "#BB99FF",
            loc.nomeUsuaria || loc.nome || "Usuária"
          )}
        />
      ))}
    </MapContainer>
  )
}