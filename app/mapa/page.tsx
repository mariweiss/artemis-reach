"use client"

import { useEffect, useState } from "react"
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps"
import { db } from "../firebase"
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore"
import { MapPin, Navigation, AlertCircle, Users, MessageSquare, Home, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Header from "../componentes/Header"

const CHAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
const USUARIO_ID = "usuario_teste"

const cores = {
  fundo: "#EEEAF8",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  branco: "#FFFFFF",
}

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

export default function Mapa() {
  const [localizacoes, setLocalizacoes] = useState<any[]>([])
  const [minhaPos, setMinhaPos] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState("Obtendo localização...")
  const pathname = usePathname()

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("GPS não disponível neste dispositivo")
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setMinhaPos({ lat: latitude, lng: longitude })
        setStatus("Localização em tempo real ativa")
        await setDoc(doc(db, "localizacoes", USUARIO_ID), {
          usuario_id: USUARIO_ID,
          nome: "Eu",
          latitude, longitude,
          fonte: "celular",
          atualizado_em: new Date().toISOString()
        })
      },
      () => setStatus("Permissão de localização negada"),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "localizacoes"), (snapshot) => {
      setLocalizacoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo }}>
      <Header />

      {/* Status */}
      <div style={{
        backgroundColor: cores.branco, padding: "10px 20px",
        display: "flex", alignItems: "center", gap: "8px",
        margin: "0 16px", borderRadius: "0 0 12px 12px",
        boxShadow: "0 2px 8px rgba(90,73,151,0.06)"
      }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%",
          backgroundColor: status.includes("ativa") ? "#22c55e" : "#f97316"
        }} />
        <span style={{ fontSize: "13px", color: "#666" }}>{status}</span>
      </div>

      {/* Mapa */}
      <APIProvider apiKey={CHAVE ?? ""}>
        <Map
          style={{ width: "100%", height: "calc(100vh - 170px)" }}
          center={minhaPos || { lat: -22.9068, lng: -43.1729 }}
          defaultZoom={15}
          mapId="artemis-map"
          disableDefaultUI={true}
        >
          {minhaPos && (
            <AdvancedMarker position={minhaPos}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                backgroundColor: cores.roxoEscuro,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "3px solid white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
              }}>
                <MapPin size={16} color={cores.branco} />
              </div>
            </AdvancedMarker>
          )}

          {localizacoes
            .filter(loc => loc.usuario_id !== USUARIO_ID)
            .map((loc) => (
              <AdvancedMarker
                key={loc.id}
                position={{ lat: loc.latitude, lng: loc.longitude }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    backgroundColor: "#FDEA72",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "3px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}>
                    <MapPin size={16} color={cores.roxoEscuro} />
                  </div>
                  <div style={{
                    backgroundColor: cores.branco, padding: "2px 8px",
                    borderRadius: "10px", fontSize: "11px",
                    fontWeight: "600", color: cores.roxoEscuro,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
                  }}>
                    {loc.nome || "Usuário"}
                  </div>
                </div>
              </AdvancedMarker>
            ))}
        </Map>
      </APIProvider>

      {/* Botão centralizar */}
      <div style={{ position: "fixed", bottom: "90px", left: "24px" }}>
        <button style={{
          width: "44px", height: "44px", borderRadius: "50%",
          backgroundColor: cores.branco, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
        }}>
          <Navigation size={20} color={cores.roxo} />
        </button>
      </div>

      {/* Botão SOS */}
      <div style={{ position: "fixed", bottom: "90px", right: "24px" }}>
        <button style={{
          width: "56px", height: "56px", borderRadius: "50%",
          backgroundColor: "#ef4444", border: "4px solid white",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.3)"
        }}>
          <AlertCircle size={24} color={cores.branco} />
        </button>
      </div>

      {/* Navegação inferior */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: cores.branco, borderTop: `1px solid ${cores.fundo}`,
        display: "flex", justifyContent: "space-around",
        padding: "10px 0", boxShadow: "0 -2px 12px rgba(90,73,151,0.08)"
      }}>
        {nav.map((item) => {
          const ativo = pathname === item.href
          return (
            <Link key={item.label} href={item.href} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: "4px",
              textDecoration: "none",
              color: ativo ? cores.roxo : "#aaa",
            }}>
              <div style={{
                padding: "6px 16px", borderRadius: "12px",
                backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent"
              }}>
                <item.icon size={20} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}