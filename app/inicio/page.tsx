"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, addDoc, collection } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Phone, Share2, AlertCircle, VolumeX, Volume2 } from "lucide-react"
import Header from "../componentes/Header"
import { useTema } from "../contexts/ThemeContext"
import { getCores } from "../cores"
import { usePresenca } from "../hooks/usePresenca"

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
  const { isDark } = useTema()
  const cores = getCores(isDark)
  usePresenca()

  const [usuario, setUsuario] = useState<any>(null)
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [modoSilencioso, setModoSilencioso] = useState(false)
  const [contando, setContando] = useState(false)
  const [contador, setContador] = useState(5)
  const [alertaEnviado, setAlertaEnviado] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid))
        if (snap.exists()) setNomeUsuario(snap.data().nome?.split(" ")[0] || "Usuária")
      } catch {}
    })
    return () => unsub()
  }, [])

  // Contagem regressiva
  useEffect(() => {
    if (!contando) return
    if (contador <= 0) {
      enviarSOS()
      return
    }
    const t = setTimeout(() => setContador(contador - 1), 1000)
    return () => clearTimeout(t)
  }, [contando, contador])

  function iniciarSOS() {
    setContando(true)
    setContador(5)
    setAlertaEnviado(false)
  }

  function cancelarSOS() {
    setContando(false)
    setContador(5)
  }

  async function enviarSOS() {
    setContando(false)
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      await addDoc(collection(db, "alertas_sos"), {
        usuario_id: usuario?.uid,
        origem: "app",
        latitude,
        longitude,
        ativo: true,
        mensagem: `${nomeUsuario} ativou o botão SOS!`,
        modo_silencioso: modoSilencioso,
        criado_em: new Date().toISOString()
      })
      setAlertaEnviado(true)
    }, async () => {
      await addDoc(collection(db, "alertas_sos"), {
        usuario_id: usuario?.uid,
        origem: "app",
        ativo: true,
        mensagem: `${nomeUsuario} ativou o botão SOS!`,
        modo_silencioso: modoSilencioso,
        criado_em: new Date().toISOString()
      })
      setAlertaEnviado(true)
    })
    setContador(5)
  }

  function compartilharLocalizacao() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      const link = `https://maps.google.com/?q=${latitude},${longitude}`
      const mensagem = `Estou compartilhando minha localização em tempo real pelo Artemis: ${link}`

      if (navigator.share) {
        // Compartilhamento nativo (celular)
        navigator.share({
          title: "Minha localização",
          text: mensagem,
        }).catch(() => {})
      } else {
        // Fallback: WhatsApp
        window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank")
      }
    }, () => {
      alert("Não foi possível obter sua localização.")
    })
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "24px 16px 120px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        <h2 style={{ fontSize: "22px", fontWeight: "700", color: cores.texto, margin: "0 0 4px", textAlign: "center" }}>
          Olá, {nomeUsuario || "Usuária"}!
        </h2>
        <p style={{ color: cores.textoSecundario, fontSize: "14px", marginBottom: "40px", textAlign: "center" }}>
          Sua segurança em um toque
        </p>

        {/* Botão SOS central */}
        <div style={{ position: "relative", marginBottom: "40px" }}>
          {!contando ? (
            <button onClick={iniciarSOS} style={{
              width: "200px", height: "200px", borderRadius: "50%",
              backgroundColor: "#ef4444", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "8px", boxShadow: "0 8px 32px rgba(239,68,68,0.4)",
              animation: "pulse-sos 2s ease-in-out infinite"
            }}>
              <AlertCircle size={56} color="white" />
              <span style={{ color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "2px" }}>SOS</span>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px" }}>Toque para acionar</span>
            </button>
          ) : (
            <button onClick={cancelarSOS} style={{
              width: "200px", height: "200px", borderRadius: "50%",
              backgroundColor: "#dc2626", border: "6px solid white", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "4px", boxShadow: "0 8px 32px rgba(239,68,68,0.6)"
            }}>
              <span style={{ color: "white", fontSize: "64px", fontWeight: "800" }}>{contador}</span>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", fontWeight: "600" }}>Toque para cancelar</span>
            </button>
          )}
        </div>

        {alertaEnviado && (
          <div style={{
            backgroundColor: "rgba(34,197,94,0.1)", borderRadius: "14px",
            padding: "14px 20px", marginBottom: "24px",
            border: "1px solid rgba(34,197,94,0.3)", textAlign: "center"
          }}>
            <p style={{ margin: 0, color: "#16a34a", fontWeight: "600", fontSize: "14px" }}>
              ✓ Alerta enviado ao seu círculo!
            </p>
          </div>
        )}

        {/* Modo silencioso */}
        <button onClick={() => setModoSilencioso(!modoSilencioso)} style={{
          display: "flex", alignItems: "center", gap: "8px",
          backgroundColor: modoSilencioso ? cores.roxo : cores.branco,
          color: modoSilencioso ? (isDark ? cores.fundo : "white") : cores.texto,
          border: `1.5px solid ${modoSilencioso ? cores.roxo : cores.borda}`,
          borderRadius: "20px", padding: "10px 20px", cursor: "pointer",
          fontSize: "13px", fontWeight: "600", marginBottom: "32px"
        }}>
          {modoSilencioso ? <VolumeX size={16} /> : <Volume2 size={16} />}
          Modo silencioso {modoSilencioso ? "ativo" : "inativo"}
        </button>

        {/* Botões de ação */}
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          {/* Ligar 190 */}
          <a href="tel:190" style={{
            flex: 1, padding: "16px", borderRadius: "16px",
            backgroundColor: cores.branco, textDecoration: "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
            boxShadow: "0 2px 8px " + cores.sombra,
            border: "1px solid " + cores.borda
          }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Phone size={22} color="#ef4444" />
            </div>
            <span style={{ fontSize: "13px", fontWeight: "600", color: cores.texto }}>Ligar 190</span>
          </a>

          {/* Compartilhar localização */}
          <button onClick={compartilharLocalizacao} style={{
            flex: 1, padding: "16px", borderRadius: "16px",
            backgroundColor: cores.branco, cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
            boxShadow: "0 2px 8px " + cores.sombra,
            border: "1px solid " + cores.borda
          }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "rgba(90,73,151,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Share2 size={22} color={cores.roxo} />
            </div>
            <span style={{ fontSize: "13px", fontWeight: "600", color: cores.texto }}>Compartilhar localização</span>
          </button>
        </div>
      </div>

      {/* Navbar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: cores.branco, borderTop: "1px solid " + cores.fundo, display: "flex", justifyContent: "space-around", padding: "10px 0", boxShadow: "0 -2px 12px " + cores.sombra, zIndex: 1000 }}>
        {nav.map((item) => {
          const ativo = pathname === item.href
          return (
            <Link key={item.label} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", color: ativo ? cores.roxo : cores.textoSecundario }}>
              <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? "rgba(90,73,151,0.1)" : "transparent" }}>
                <item.icon size={20} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <style>{`
        @keyframes pulse-sos {
          0%, 100% { box-shadow: 0 8px 32px rgba(239,68,68,0.4); }
          50% { box-shadow: 0 8px 42px rgba(239,68,68,0.7); }
        }
      `}</style>
    </div>
  )
}