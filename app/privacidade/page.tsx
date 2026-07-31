"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Navigation, Shield } from "lucide-react"
import Header from "../componentes/Header"
import { useTema } from "../contexts/ThemeContext"
import { getCores } from "../cores"

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

export default function Privacidade() {
  const pathname = usePathname()
  const router = useRouter()
  const { isDark } = useTema()
  const cores = getCores(isDark)

  const [usuario, setUsuario] = useState<any>(null)
  const [configs, setConfigs] = useState({
    locReal: true,
    rotasFreq: true,
    historico: true,
    statusOnline: true,
    convites: true,
    anonimo: false
  })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
      // Carrega configs salvas
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid))
        if (snap.exists() && snap.data().privacidade) {
          setConfigs(prev => ({ ...prev, ...snap.data().privacidade }))
        }
      } catch {}
    })
    return () => unsub()
  }, [])

  function toggle(key: string) {
    setConfigs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  async function salvar() {
    if (!usuario) return
    setSalvando(true)
    try {
      await setDoc(doc(db, "usuarios", usuario.uid), {
        privacidade: configs
      }, { merge: true })
      setMsg("Preferências salvas!")
      setTimeout(() => setMsg(""), 2000)
    } catch {
      setMsg("Erro ao salvar.")
    }
    setSalvando(false)
  }

  function Toggle({ ativo, onChange }: any) {
    return (
      <button onClick={onChange} style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: ativo ? cores.amarelo : "#e5e7eb", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0 }}>
        <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: ativo ? "23px" : "3px", transition: "left 0.2s" }} />
      </button>
    )
  }

  function Secao({ icon: Icon, titulo, children }: any) {
    return (
      <div style={{ backgroundColor: cores.branco, borderRadius: "16px", marginBottom: "16px", overflow: "hidden", boxShadow: "0 1px 4px " + cores.sombra }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid " + cores.fundo, display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon size={18} color={cores.roxo} />
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: cores.texto }}>{titulo}</h3>
        </div>
        <div style={{ padding: "4px 0" }}>{children}</div>
      </div>
    )
  }

  function Item({ label, desc, ativo, onChange }: any) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid " + cores.fundo }}>
        <div style={{ flex: 1, marginRight: "12px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: cores.texto }}>{label}</p>
          {desc && <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.textoSecundario }}>{desc}</p>}
        </div>
        <Toggle ativo={ativo} onChange={onChange} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px 120px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: cores.texto, margin: "0 0 4px" }}>Privacidade</h2>
        <p style={{ color: cores.textoSecundario, fontSize: "13px", marginBottom: "24px" }}>Controle quem pode ver suas informações</p>

        <Secao icon={Navigation} titulo="Localização">
          <Item label="Compartilhar localização em tempo real" desc="Permite que seu círculo veja onde você está" ativo={configs.locReal} onChange={() => toggle("locReal")} />
          <Item label="Compartilhar rotas frequentes" desc="Seu círculo pode ver suas rotas mais usadas" ativo={configs.rotasFreq} onChange={() => toggle("rotasFreq")} />
          <Item label="Salvar histórico de localização" desc="Mantém registro dos locais visitados" ativo={configs.historico} onChange={() => toggle("historico")} />
        </Secao>

        <Secao icon={Users} titulo="Social">
          <Item label="Mostrar status online" desc="Seu círculo pode ver quando você está online" ativo={configs.statusOnline} onChange={() => toggle("statusOnline")} />
          <Item label="Permitir convites para círculo" desc="Outras usuárias podem te convidar" ativo={configs.convites} onChange={() => toggle("convites")} />
          <Item label="Publicações anônimas por padrão" desc="Suas publicações na comunidade serão anônimas" ativo={configs.anonimo} onChange={() => toggle("anonimo")} />
        </Secao>

        {msg && <p style={{ textAlign: "center", color: msg.includes("Erro") ? "#ef4444" : "#16a34a", fontSize: "13px", marginBottom: "12px" }}>{msg}</p>}

        <button onClick={salvar} disabled={salvando} style={{ width: "100%", padding: "14px", backgroundColor: cores.roxo, color: isDark ? cores.fundo : cores.branco, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
          {salvando ? "Salvando..." : "Salvar Preferências"}
        </button>
      </div>

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
    </div>
  )
}