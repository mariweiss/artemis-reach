"use client"

import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, doc, setDoc, query, where, getDoc } from "firebase/firestore"
import { MapPin, Navigation, AlertCircle, Users, MessageSquare, Home, Bell, Layers, Check, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Header from "../componentes/Header"
import dynamic from "next/dynamic"

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

// Leaflet só funciona no browser, então carregamos dinamicamente
const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), { ssr: false })

export default function Mapa() {
  const [localizacoes, setLocalizacoes] = useState<any[]>([])
  const [minhaPos, setMinhaPos] = useState<{ lat: number; lng: number } | null>(null)
  const [status, setStatus] = useState("Obtendo localização...")
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [grupos, setGrupos] = useState<any[]>([])
  const [gruposSelecionados, setGruposSelecionados] = useState<Set<string>>(new Set())
  const [modalGrupos, setModalGrupos] = useState(false)
  const pathname = usePathname()
  const [centralizar, setCentralizar] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUsuarioId(user.uid)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!usuarioId) return
    const q = query(collection(db, "grupos"), where("membros", "array-contains", usuarioId))
    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setGrupos(dados)
      setGruposSelecionados(new Set(dados.map((g: any) => g.id)))
    })
    return () => unsub()
  }, [usuarioId])

  useEffect(() => {
    if (!usuarioId) return
    if (!navigator.geolocation) { setStatus("GPS não disponível"); return }
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setMinhaPos({ lat: latitude, lng: longitude })
        setStatus("Localização em tempo real ativa")
        await setDoc(doc(db, "localizacoes", usuarioId), {
          usuario_id: usuarioId, latitude, longitude,
          atualizado_em: new Date().toISOString()
        })
      },
      () => setStatus("Permissão de localização negada"),
      { enableHighAccuracy: true, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [usuarioId])

  useEffect(() => {
    if (!usuarioId) return

    const idsParaMostrar = new Set<string>()

    // IDs dos grupos selecionados
    grupos.forEach((grupo) => {
      if (gruposSelecionados.has(grupo.id)) {
        ; (grupo.membros || []).forEach((uid: string) => {
          if (uid !== usuarioId) idsParaMostrar.add(uid)
        })
      }
    })

    // Busca também contatos individuais do círculo
    const qCirculo = query(
      collection(db, "circulos"),
      where("usuarios", "array-contains", usuarioId),
      where("status", "==", "confirmado")
    )

    const unsubCirculo = onSnapshot(qCirculo, async (snapCirculo) => {
      snapCirculo.docs.forEach(d => {
        const data = d.data() as any
        const outroId = data.usuarios.find((id: string) => id !== usuarioId)
        if (outroId) idsParaMostrar.add(outroId)
      })

      if (idsParaMostrar.size === 0) { setLocalizacoes([]); return }

      const q = query(
        collection(db, "localizacoes"),
        where("usuario_id", "in", [...idsParaMostrar])
      )

      onSnapshot(q, async (snap) => {
        const locs = await Promise.all(snap.docs.map(async (d) => {
          const data = { id: d.id, ...d.data() } as any
          const grupoDoMembro = grupos.find((g) => gruposSelecionados.has(g.id) && (g.membros || []).includes(data.usuario_id))
          data.corGrupo = grupoDoMembro?.cor || cores.roxoClaro
          data.nomeGrupo = grupoDoMembro?.nome || ""
          try {
            const perfil = await getDoc(doc(db, "usuarios", data.usuario_id))
            if (perfil.exists()) {
              data.nomeUsuaria = perfil.data()?.nome?.split(" ")[0] || "Usuária"
            }
          } catch {
            data.nomeUsuaria = "Usuária"
          }
          return data
        }))
        setLocalizacoes(locs)
      })
    })

    return () => unsubCirculo()
  }, [usuarioId, grupos, gruposSelecionados])

  function toggleGrupo(grupoId: string) {
    setGruposSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(grupoId)) novo.delete(grupoId)
      else novo.add(grupoId)
      return novo
    })
  }

  function toggleTodos() {
    if (gruposSelecionados.size === grupos.length) setGruposSelecionados(new Set())
    else setGruposSelecionados(new Set(grupos.map((g) => g.id)))
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo }}>
      <Header />

      <div style={{
        backgroundColor: cores.branco, padding: "10px 20px",
        display: "flex", alignItems: "center", gap: "8px",
        margin: "0 16px", borderRadius: "0 0 12px 12px",
        boxShadow: "0 2px 8px rgba(90,73,151,0.06)"
      }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: status.includes("ativa") ? "#22c55e" : "#f97316" }} />
        <span style={{ fontSize: "13px", color: "#666" }}>{status}</span>
        {localizacoes.length > 0 && (
          <span style={{ fontSize: "12px", color: cores.roxo, marginLeft: "auto" }}>
            {localizacoes.length} pessoa{localizacoes.length > 1 ? "s" : ""} visível{localizacoes.length > 1 ? "is" : ""}
          </span>
        )}
      </div>

      {/* Mapa Leaflet */}
      <div style={{ width: "100%", height: "calc(100vh - 170px)" }}>
        <MapaLeaflet minhaPos={minhaPos} localizacoes={localizacoes} centralizar={centralizar} />
      </div>

      {/* Botão centralizar */}
      <div style={{ position: "fixed", bottom: "90px", left: "24px", zIndex: 1000 }}>
        <button onClick={() => { setCentralizar(true); setTimeout(() => setCentralizar(false), 500) }} 
        style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: cores.branco, 
        border: "none", display: "flex", alignItems: "center", justifyContent: "center", 
        cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <Navigation size={20} color={cores.roxo} />
        </button>
      </div>

      {/* Botão grupos */}
      <div style={{ position: "fixed", bottom: "148px", right: "24px", zIndex: 1000 }}>
        <button onClick={() => setModalGrupos(true)} style={{
          width: "44px", height: "44px", borderRadius: "50%",
          backgroundColor: cores.branco, border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "relative"
        }}>
          <Layers size={20} color={cores.roxo} />
          {gruposSelecionados.size > 0 && (
            <div style={{
              position: "absolute", top: "-4px", right: "-4px",
              width: "18px", height: "18px", borderRadius: "50%",
              backgroundColor: cores.roxo, color: "white",
              fontSize: "10px", fontWeight: "700",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {gruposSelecionados.size}
            </div>
          )}
        </button>
      </div>

      {/* Botão SOS */}
      <div style={{ position: "fixed", bottom: "90px", right: "24px", zIndex: 1000 }}>
        <button style={{
          width: "56px", height: "56px", borderRadius: "50%",
          backgroundColor: "#ef4444", border: "4px solid white",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.3)"
        }}>
          <AlertCircle size={24} color={cores.branco} />
        </button>
      </div>

      {/* Modal grupos */}
      {modalGrupos && (
        <>
          <div onClick={() => setModalGrupos(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200 }} />
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            backgroundColor: cores.branco, borderRadius: "24px 24px 0 0",
            padding: "24px", zIndex: 300,
            boxShadow: "0 -4px 24px rgba(90,73,151,0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "17px" }}>Grupos no mapa</h3>
                <p style={{ color: cores.lavanda, margin: "4px 0 0", fontSize: "12px" }}>Selecione quais grupos visualizar</p>
              </div>
              <button onClick={() => setModalGrupos(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color={cores.lavanda} />
              </button>
            </div>

            {grupos.length > 1 && (
              <button onClick={toggleTodos} style={{
                width: "100%", padding: "12px 16px", borderRadius: "12px",
                backgroundColor: cores.fundo, border: "none",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", marginBottom: "12px"
              }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro }}>
                  {gruposSelecionados.size === grupos.length ? "Desmarcar todos" : "Selecionar todos"}
                </span>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "6px",
                  backgroundColor: gruposSelecionados.size === grupos.length ? cores.roxo : "transparent",
                  border: `2px solid ${gruposSelecionados.size === grupos.length ? cores.roxo : "#ddd"}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {gruposSelecionados.size === grupos.length && <Check size={12} color="white" />}
                </div>
              </button>
            )}

            {grupos.length === 0 ? (
              <p style={{ color: cores.lavanda, fontSize: "14px", textAlign: "center" }}>Nenhum grupo criado ainda.</p>
            ) : grupos.map((grupo) => {
              const ativo = gruposSelecionados.has(grupo.id)
              return (
                <button key={grupo.id} onClick={() => toggleGrupo(grupo.id)} style={{
                  width: "100%", padding: "14px 16px", borderRadius: "14px",
                  border: `1.5px solid ${ativo ? grupo.cor : "rgba(90,73,151,0.1)"}`,
                  backgroundColor: ativo ? `${grupo.cor}12` : cores.branco,
                  display: "flex", alignItems: "center", gap: "12px",
                  cursor: "pointer", marginBottom: "8px"
                }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: grupo.cor || cores.roxo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={18} color="white" />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{grupo.nome}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>
                      {(grupo.membros?.length || 1) - 1} membro{((grupo.membros?.length || 1) - 1) !== 1 ? "s" : ""} além de você
                    </p>
                  </div>
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "6px",
                    backgroundColor: ativo ? grupo.cor : "transparent",
                    border: `2px solid ${ativo ? grupo.cor : "#ddd"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {ativo && <Check size={13} color="white" />}
                  </div>
                </button>
              )
            })}

            <button onClick={() => setModalGrupos(false)} style={{
              width: "100%", marginTop: "8px", padding: "14px",
              backgroundColor: cores.roxo, color: "white",
              border: "none", borderRadius: "14px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer"
            }}>
              Ver no mapa
            </button>
          </div>
        </>
      )}

      {/* Navbar */}
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
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
              textDecoration: "none", color: ativo ? cores.roxo : "#aaa",
            }}>
              <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent" }}>
                <item.icon size={20} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}