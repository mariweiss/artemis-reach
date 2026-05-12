"use client"

import { useState } from "react"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Volume2, Vibrate, Moon, Globe, HardDrive, HelpCircle, FileText, LogOut, ChevronRight, Info } from "lucide-react"
import Header from "../componentes/Header"

const cores = { fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F", roxoClaro: "#BB99FF", lavanda: "#8575BD", branco: "#FFFFFF" }
const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

function Toggle({ ativo, onChange }) {
  return (
    <button onClick={onChange} style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: ativo ? cores.roxo : "#e5e7eb", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: ativo ? "23px" : "3px", transition: "left 0.2s" }} />
    </button>
  )
}

export default function Configuracoes() {
  const pathname = usePathname()
  const router = useRouter()
  const [notifs, setNotifs] = useState({ som: true, vibracao: true, modoEscuro: false })
  const [idioma, setIdioma] = useState("pt-BR")

  function toggle(key) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Configurações</h2>
        <p style={{ color: cores.lavanda, marginBottom: "24px", fontSize: "14px" }}>Personalize sua experiência no Artemis</p>

        {/* Notificações */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notificações</p>
        {[
          { key: "som", icon: Volume2, label: "Som", desc: "Ativar sons de notificação" },
          { key: "vibracao", icon: Vibrate, label: "Vibração", desc: "Vibrar ao receber alertas" },
          { key: "modoEscuro", icon: Moon, label: "Modo escuro", desc: "Interface com fundo escuro (em breve)" },
        ].map((item) => (
          <div key={item.key} style={{ backgroundColor: cores.branco, borderRadius: "14px", padding: "14px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <item.icon size={18} color={cores.roxo} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
            </div>
            <Toggle ativo={notifs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}

        {/* Idioma */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Idioma</p>
        <div style={{ backgroundColor: cores.branco, borderRadius: "14px", padding: "14px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={18} color={cores.roxo} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>Idioma</p>
          </div>
          <select value={idioma} onChange={(e) => setIdioma(e.target.value)} style={{ border: "none", outline: "none", color: cores.roxo, fontWeight: "600", fontSize: "13px", backgroundColor: "transparent", cursor: "pointer" }}>
            <option value="pt-BR">Português (BR)</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Armazenamento */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Armazenamento</p>
        {[
          { icon: HardDrive, label: "Limpar cache", desc: "Liberar espaço no dispositivo", acao: () => alert("Cache limpo!") },
          { icon: HardDrive, label: "Backup de dados", desc: "Última vez: nunca", acao: () => alert("Em breve!") },
        ].map((item, i) => (
          <button key={i} onClick={item.acao} style={{ width: "100%", backgroundColor: cores.branco, borderRadius: "14px", padding: "14px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)", border: "none", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <item.icon size={18} color={cores.roxo} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
            </div>
            <ChevronRight size={16} color={cores.lavanda} />
          </button>
        ))}

        {/* Suporte */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Suporte</p>
        {[
          { icon: HelpCircle, label: "Central de ajuda", desc: "Tutoriais e perguntas frequentes", href: "#" },
          { icon: FileText, label: "Termos de uso", desc: "Leia nossos termos e condições", href: "#" },
        ].map((item, i) => (
          <a key={i} href={item.href} style={{ display: "flex", backgroundColor: cores.branco, borderRadius: "14px", padding: "14px 16px", marginBottom: "8px", alignItems: "center", gap: "12px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)", textDecoration: "none" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <item.icon size={18} color={cores.roxo} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
            </div>
            <ChevronRight size={16} color={cores.lavanda} />
          </a>
        ))}

        {/* Versão */}
        <div style={{ backgroundColor: cores.branco, borderRadius: "14px", padding: "14px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Info size={18} color={cores.roxo} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>Versão do app</p>
            <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>Artemis Reach v1.0.0 (beta)</p>
          </div>
        </div>

        {/* Sair */}
        <button onClick={async () => { await signOut(auth); router.push("/") }} style={{ width: "100%", marginTop: "8px", padding: "14px", backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <LogOut size={18} /> Sair da conta
        </button>
      </div>
      <NavBar nav={nav} pathname={pathname} cores={cores} />
    </div>
  )
}

function NavBar({ nav, pathname, cores }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: cores.branco, borderTop: `1px solid ${cores.fundo}`, display: "flex", justifyContent: "space-around", padding: "10px 0", boxShadow: "0 -2px 12px rgba(90,73,151,0.08)" }}>
      {nav.map((item) => {
        const ativo = pathname === item.href
        return (
          <Link key={item.label} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", color: ativo ? cores.roxo : "#aaa" }}>
            <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent" }}>
              <item.icon size={20} />
            </div>
            <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}