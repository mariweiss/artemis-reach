"use client"

import { useState, useEffect, useRef } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc, collection, addDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import { MapPin, Users, MessageSquare, Home, Bell, Shield, Phone, Bluetooth, Volume2, Navigation, X } from "lucide-react"
import Link from "next/link"
import Header from "../componentes/Header"

const cores = {
  fundo: "#EEEAF8",
  fundoCard: "#F5F2FC",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  lavanda: "#8575BD",
  amarelo: "#FDEA72",
  branco: "#FFFFFF",
}

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

export default function Inicio() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<User | null>(null)
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [sosAtivo, setSosAtivo] = useState(false)
  const [contagem, setContagem] = useState<number | null>(null)
  const [alertaEnviado, setAlertaEnviado] = useState(false)
  const [modoSilencioso, setModoSilencioso] = useState(false)
  const [pressionando, setPressionando] = useState(false)
  const [progressoHold, setProgressoHold] = useState(0)
  const holdTimer = useRef<any>(null)
  const progressTimer = useRef<any>(null)
  const contagemTimer = useRef<any>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
      try {
        const docSnap = await getDoc(doc(db, "usuarios", user.uid))
        if (docSnap.exists()) {
          setNomeUsuario(docSnap.data().nome?.split(" ")[0] || "Usuária")
        } else {
          setNomeUsuario(user.email?.split("@")[0] || "Usuária")
        }
      } catch {
        setNomeUsuario("Usuária")
      }
    })
    return () => unsub()
  }, [])


  useEffect(() => () => {
    clearTimeout(holdTimer.current)
    clearInterval(progressTimer.current)
    clearInterval(contagemTimer.current)
  }, [])

  function toqueSimples() {
    if (sosAtivo || alertaEnviado) return
    let c = 3
    setContagem(c)
    contagemTimer.current = setInterval(() => {
      c--
      setContagem(c)
      if (c <= 0) {
        clearInterval(contagemTimer.current)
        setContagem(null)
        ativarSOS()
      }
    }, 1000)
  }

  function cancelarContagem() {
    if (contagemTimer.current) {
      clearInterval(contagemTimer.current)
      setContagem(null)
    }
  }

  function iniciarHold() {
    if (sosAtivo || alertaEnviado) return
    setPressionando(true)
    setProgressoHold(0)
    let prog = 0
    progressTimer.current = setInterval(() => {
      prog += 3.33
      setProgressoHold(Math.min(prog, 100))
    }, 100)
    holdTimer.current = setTimeout(() => {
      clearInterval(progressTimer.current)
      setProgressoHold(100)
      setPressionando(false)
      ativarSOS()
    }, 3000)
  }

  function soltarHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    if (progressTimer.current) clearInterval(progressTimer.current)
    setPressionando(false)
    setProgressoHold(0)
  }

  async function ativarSOS() {
    setSosAtivo(true)
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        await addDoc(collection(db, "alertas_sos"), {
          usuario_id: usuario?.uid || "anonimo",
          origem: "app",
          latitude,
          longitude,
          modo_silencioso: modoSilencioso,
          mensagem: `${nomeUsuario} acionou o botão SOS!`,
          ativo: true,
          criado_em: new Date().toISOString()
        })
      },
      async () => {
        // Salva mesmo sem GPS
        await addDoc(collection(db, "alertas_sos"), {
          usuario_id: usuario?.uid || "anonimo",
          origem: "app",
          modo_silencioso: modoSilencioso,
          mensagem: `${nomeUsuario} acionou o botão SOS!`,
          ativo: true,
          criado_em: new Date().toISOString()
        })
      }
    )
    setTimeout(() => setAlertaEnviado(true), 500)
  }

  function tocarSirene() {
    try {
      const ctx = new AudioContext()
      const duracao = 3
      for (let i = 0; i < duracao * 4; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(880, ctx.currentTime + i * 0.25)
        osc.frequency.setValueAtTime(660, ctx.currentTime + i * 0.25 + 0.125)
        gain.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.25)
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.25 + 0.24)
        osc.start(ctx.currentTime + i * 0.25)
        osc.stop(ctx.currentTime + i * 0.25 + 0.25)
      }
    } catch (e) {
      console.error("Erro ao tocar sirene:", e)
    }
  }

  function resetarSOS() {
    setSosAtivo(false)
    setAlertaEnviado(false)
    setContagem(null)
    setProgressoHold(0)
  }

  if (!usuario) return (
    <div style={{
      minHeight: "100vh", backgroundColor: cores.fundo,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: `3px solid ${cores.roxo}`, borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
        }} />
        <p style={{ color: cores.lavanda, fontSize: "14px" }}>Carregando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: cores.fundo, fontFamily: "sans-serif", paddingBottom: "80px" }}>
      <Header />

      <div style={{ padding: "20px 24px 0" }}>
        <p style={{ color: cores.lavanda, fontSize: "13px", margin: "0 0 2px" }}>Olá,</p>
        <h2 style={{ color: cores.roxoEscuro, fontSize: "22px", fontWeight: "800", margin: "0 0 12px" }}>
          {nomeUsuario}
        </h2>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          backgroundColor: "rgba(34,197,94,0.1)", padding: "8px 16px",
          borderRadius: "20px", border: "1px solid rgba(34,197,94,0.2)"
        }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)"
          }} />
          <span style={{ color: "#16a34a", fontSize: "13px", fontWeight: "500" }}>
            Você está em uma área segura
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px" }}>
        <div style={{ position: "relative", marginBottom: "20px" }}>
          {(sosAtivo || pressionando) && [1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: `${180 + i * 50}px`, height: `${180 + i * 50}px`,
              borderRadius: "50%", border: "2px solid rgba(239,68,68,0.25)",
              animation: `pulse-ring ${0.9 + i * 0.3}s ease-out infinite`,
              animationDelay: `${i * 0.2}s`
            }} />
          ))}

          {pressionando && (
            <svg style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", width: "200px", height: "200px"
            }} viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="4" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#ef4444" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progressoHold / 100)}`}
                transform="rotate(-90 100 100)"
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
          )}

          <button
            onClick={contagem !== null ? cancelarContagem : toqueSimples}
            onMouseDown={iniciarHold}
            onMouseUp={soltarHold}
            onTouchStart={iniciarHold}
            onTouchEnd={soltarHold}
            style={{
              width: "180px", height: "180px", borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #ff6b6b, #dc2626)",
              border: "6px solid white", cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(239,68,68,0.25)",
              transform: pressionando ? "scale(0.96)" : "scale(1)",
              transition: "transform 0.1s", position: "relative", zIndex: 1
            }}
          >
            <Shield size={36} color="white" strokeWidth={1.5} />
            <span style={{ color: "white", fontSize: "22px", fontWeight: "800", letterSpacing: "3px", marginTop: "8px" }}>
              {contagem !== null ? contagem : "SOS"}
            </span>
          </button>
        </div>

        <p style={{ color: cores.lavanda, fontSize: "13px", textAlign: "center", maxWidth: "280px", lineHeight: "1.6" }}>
          {alertaEnviado
            ? "✓ Alerta enviado com sucesso"
            : contagem !== null
              ? "Toque para cancelar"
              : "Pressione e segure em emergência. Seus contatos serão notificados imediatamente."}
        </p>

        {alertaEnviado && (
          <div style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "16px", width: "100%", maxWidth: "340px", marginTop: "16px",
            boxShadow: "0 2px 12px rgba(90,73,151,0.1)",
            border: "1px solid rgba(239,68,68,0.2)"
          }}>
            {[
              { label: "Alerta enviado", status: "✓ Confirmado", cor: "#16a34a" },
              { label: "Localização", status: "✓ Compartilhada", cor: "#16a34a" },
              { label: "Contatos notificados", status: "Aguardando...", cor: cores.roxo },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < 2 ? "10px" : 0 }}>
                <span style={{ color: cores.lavanda, fontSize: "13px" }}>{item.label}</span>
                <span style={{ color: item.cor, fontSize: "13px", fontWeight: "600" }}>{item.status}</span>
              </div>
            ))}
            <button onClick={resetarSOS} style={{
              width: "100%", marginTop: "14px", padding: "10px",
              backgroundColor: cores.fundo, color: cores.roxo,
              border: `1px solid ${cores.roxoClaro}`, borderRadius: "10px",
              cursor: "pointer", fontSize: "13px", fontWeight: "600"
            }}>
              Cancelar alerta
            </button>
          </div>
        )}
      </div>

      {!alertaEnviado && (
        <div style={{ padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            {[
              { icon: <Navigation size={18} color={cores.roxo} />, label: "Compartilhar rota", vermelho: false, acao: () => { } },
              { icon: <Phone size={18} color="white" />, label: "Ligar 190", vermelho: true, acao: () => window.open("tel:190") },
              { icon: <Bluetooth size={18} color={cores.roxo} />, label: "Dispositivo Echo", vermelho: false, acao: () => { } },
              { icon: <Volume2 size={18} color={cores.roxo} />, label: "Sirene sonora", vermelho: false, acao: tocarSirene },
            ].map((item, i) => (
              <button key={i} onClick={item.acao} style={{
                backgroundColor: item.vermelho ? "rgba(239,68,68,0.1)" : cores.branco,
                border: `1px solid ${item.vermelho ? "rgba(239,68,68,0.3)" : "rgba(90,73,151,0.15)"}`,
                borderRadius: "14px", padding: "14px 16px",
                display: "flex", alignItems: "center", gap: "10px",
                cursor: "pointer", boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
              }}>
                {item.icon}
                <span style={{ color: item.vermelho ? "#dc2626" : cores.roxoEscuro, fontSize: "13px", fontWeight: "500" }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <button onClick={() => setModoSilencioso(!modoSilencioso)} style={{
            width: "100%", padding: "14px",
            backgroundColor: modoSilencioso ? `rgba(90,73,151,0.15)` : cores.branco,
            border: `1px solid ${modoSilencioso ? cores.roxo : "rgba(90,73,151,0.15)"}`,
            borderRadius: "14px", color: modoSilencioso ? cores.roxo : cores.lavanda,
            fontSize: "14px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            fontWeight: modoSilencioso ? "600" : "400",
            boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
          }}>
            <Shield size={16} />
            {modoSilencioso ? "Modo Silencioso ativo" : "Modo Silencioso"}
          </button>
        </div>
      )}

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
              textDecoration: "none", color: ativo ? cores.roxo : "#aaa",
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

      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}