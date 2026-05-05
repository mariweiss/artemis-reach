"use client"

import { useEffect, useState } from "react"
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps"
import { db } from "../firebase"
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore"

const CHAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
const USUARIO_ID = "usuario_teste" // depois vira o ID real do login

export default function Mapa() {
  const [localizacoes, setLocalizacoes] = useState([])
  const [minhaPos, setMinhaPos] = useState(null)
  const [status, setStatus] = useState("Obtendo localização...")

  // Pega localização real do celular/navegador
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

        // Salva no Firebase
        await setDoc(doc(db, "localizacoes", USUARIO_ID), {
          usuario_id: USUARIO_ID,
          nome: "Eu",
          latitude,
          longitude,
          fonte: "celular",
          atualizado_em: new Date().toISOString()
        })
      },
      (erro) => {
        setStatus("Permissão de localização negada")
        console.error(erro)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Escuta localizações de todos do círculo em tempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "localizacoes"), (snapshot) => {
      setLocalizacoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  return (
    <div style={{ fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{
        backgroundColor: "white", padding: "16px 24px",
        borderBottom: "1px solid #eee", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px" }}>📍</span>
          <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "bold" }}>Ártemis</h1>
        </div>
        <span style={{ fontSize: "22px", cursor: "pointer" }}>☰</span>
      </div>

      {/* Status */}
      <div style={{
        backgroundColor: "white", padding: "10px 24px",
        display: "flex", alignItems: "center", gap: "8px",
        borderBottom: "1px solid #eee"
      }}>
        <div style={{
          width: "10px", height: "10px", borderRadius: "50%",
          backgroundColor: status.includes("ativa") ? "#22c55e" : "#f97316"
        }} />
        <span style={{ fontSize: "13px", color: "#555" }}>{status}</span>
      </div>

      {/* Mapa */}
      <APIProvider apiKey={CHAVE}>
        <Map
          style={{ width: "100%", height: "calc(100vh - 175px)" }}
          defaultCenter={minhaPos || { lat: -22.9068, lng: -43.1729 }}
          defaultZoom={15}
          mapId="artemis-map"
        >
          {/* Pin da minha localização */}
          {minhaPos && (
            <AdvancedMarker position={minhaPos}>
              <Pin
                background="#1a1a2e"
                borderColor="white"
                glyphColor="white"
              />
            </AdvancedMarker>
          )}

          {/* Pins dos outros usuários */}
          {localizacoes
            .filter(loc => loc.usuario_id !== USUARIO_ID)
            .map((loc) => (
              <AdvancedMarker
                key={loc.id}
                position={{ lat: loc.latitude, lng: loc.longitude }}
              >
                <Pin
                  background={loc.fonte === "dispositivo" ? "#f97316" : "#6B4C9A"}
                  borderColor="white"
                  glyphColor="white"
                />
              </AdvancedMarker>
            ))}
        </Map>
      </APIProvider>

      {/* Botão SOS */}
      <div style={{ position: "fixed", bottom: "80px", right: "24px" }}>
        <button style={{
          width: "64px", height: "64px", borderRadius: "50%",
          backgroundColor: "#ef4444", color: "white",
          border: "4px solid white", fontSize: "28px",
          cursor: "pointer", fontWeight: "bold",
          boxShadow: "0 4px 20px rgba(239,68,68,0.6)"
        }}>
          !
        </button>
      </div>

      {/* Navegação inferior */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "white", borderTop: "1px solid #eee",
        display: "flex", justifyContent: "space-around",
        padding: "12px 0", boxShadow: "0 -2px 10px rgba(0,0,0,0.06)"
      }}>
        {[
          { icon: "📍", label: "Mapa", href: "/mapa" },
          { icon: "👥", label: "Círculo", href: "/circulo" },
          { icon: "💬", label: "Comunidade", href: "/comunidade" }
        ].map((item) => (
          <a key={item.label} href={item.href} style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "4px",
            textDecoration: "none", color: "#6B4C9A",
            fontSize: "12px", fontWeight: "500"
          }}>
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}