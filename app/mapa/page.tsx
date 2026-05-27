"use client"

import { useEffect, useState } from "react"
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, doc, setDoc, query, where } from "firebase/firestore"
import {
  MapPin,
  Navigation,
  AlertCircle,
  Users,
  MessageSquare,
  Home,
  Bell,
  Layers,
  Check,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Header from "../componentes/Header"

const CHAVE: string = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""

if (!CHAVE) {
  throw new Error("Google Maps API Key não encontrada")
}

const cores = {
  fundo: "#EEEAF8",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  lavanda: "#8575BD",
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
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<any[]>([])
  const [gruposSelecionados, setGruposSelecionados] = useState<Set<string>>(new Set())
  const [modalGrupos, setModalGrupos] = useState(false)

  const pathname = usePathname()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUsuarioId(user.uid)
    })

    return () => unsub()
  }, [])

  useEffect(() => {
    if (!usuarioId) return

    const q = query(
      collection(db, "grupos"),
      where("membros", "array-contains", usuarioId)
    )

    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))

      setGrupos(dados)
      setGruposSelecionados(new Set(dados.map((g: any) => g.id)))
    })

    return () => unsub()
  }, [usuarioId])

  useEffect(() => {
    if (!usuarioId) return

    if (!navigator.geolocation) {
      setStatus("GPS não disponível neste dispositivo")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

        setMinhaPos({
          lat: latitude,
          lng: longitude
        })

        setStatus("Localização em tempo real ativa")

        await setDoc(doc(db, "localizacoes", usuarioId), {
          usuario_id: usuarioId,
          latitude,
          longitude,
          atualizado_em: new Date().toISOString()
        })
      },
      () => {
        setStatus("Permissão de localização negada")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [usuarioId])

  useEffect(() => {
    if (!usuarioId || grupos.length === 0) {
      setLocalizacoes([])
      return
    }

    const idsParaMostrar = new Set<string>()

    grupos.forEach((grupo) => {
      if (gruposSelecionados.has(grupo.id)) {
        ;(grupo.membros || []).forEach((uid: string) => {
          if (uid !== usuarioId) {
            idsParaMostrar.add(uid)
          }
        })
      }
    })

    if (idsParaMostrar.size === 0) {
      setLocalizacoes([])
      return
    }

    const q = query(
      collection(db, "localizacoes"),
      where("usuario_id", "in", [...idsParaMostrar])
    )

    const unsub = onSnapshot(q, (snap) => {
      const locs = snap.docs.map((d) => {
        const data = {
          id: d.id,
          ...d.data()
        } as any

        const grupoDoMembro = grupos.find(
          (g) =>
            gruposSelecionados.has(g.id) &&
            (g.membros || []).includes(data.usuario_id)
        )

        data.corGrupo = grupoDoMembro?.cor || cores.roxoClaro
        data.nomeGrupo = grupoDoMembro?.nome || ""

        return data
      })

      setLocalizacoes(locs)
    })

    return () => unsub()
  }, [usuarioId, grupos, gruposSelecionados])

  function toggleGrupo(grupoId: string) {
    setGruposSelecionados((prev) => {
      const novo = new Set(prev)

      if (novo.has(grupoId)) {
        novo.delete(grupoId)
      } else {
        novo.add(grupoId)
      }

      return novo
    })
  }

  function toggleTodos() {
    if (gruposSelecionados.size === grupos.length) {
      setGruposSelecionados(new Set())
    } else {
      setGruposSelecionados(new Set(grupos.map((g) => g.id)))
    }
  }

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: cores.fundo
      }}
    >
      <Header />

      <div
        style={{
          backgroundColor: cores.branco,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          margin: "0 16px",
          borderRadius: "0 0 12px 12px",
          boxShadow: "0 2px 8px rgba(90,73,151,0.06)"
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: status.includes("ativa")
              ? "#22c55e"
              : "#f97316"
          }}
        />

        <span
          style={{
            fontSize: "13px",
            color: "#666"
          }}
        >
          {status}
        </span>

        {localizacoes.length > 0 && (
          <span
            style={{
              fontSize: "12px",
              color: cores.roxo,
              marginLeft: "auto"
            }}
          >
            {localizacoes.length} pessoa
            {localizacoes.length > 1 ? "s" : ""} visível
            {localizacoes.length > 1 ? "is" : ""}
          </span>
        )}
      </div>

      <APIProvider apiKey={CHAVE}>
        <Map
          style={{
            width: "100%",
            height: "calc(100vh - 170px)"
          }}
          center={minhaPos || { lat: -22.9068, lng: -43.1729 }}
          defaultZoom={15}
          mapId="artemis-map"
          disableDefaultUI={true}
        >
          {minhaPos && (
            <AdvancedMarker position={minhaPos}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: cores.roxoEscuro,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}
              >
                <MapPin size={16} color={cores.branco} />
              </div>
            </AdvancedMarker>
          )}

          {localizacoes.map((loc) => (
            <AdvancedMarker
              key={loc.id}
              position={{
                lat: loc.latitude,
                lng: loc.longitude
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: loc.corGrupo,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "3px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}
                >
                  <MapPin size={16} color="white" />
                </div>

                <div
                  style={{
                    backgroundColor: cores.branco,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: cores.roxoEscuro,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  {loc.nome || loc.nomeGrupo || "Círculo"}
                </div>
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  )
}