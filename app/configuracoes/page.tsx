"use client"

import { useState } from "react"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Volume2, Vibrate, Moon, Globe, HardDrive, HelpCircle, FileText, LogOut, ChevronRight, Info } from "lucide-react"
import Header from "../componentes/Header"

const cores = { fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F", roxoClaro: "#BB99FF", lavanda: "#8575BD", amarelo: "#FDEA72", branco: "#FFFFFF" }
const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

function Toggle({ ativo, onChange }) {
  return (
    <button onClick={onChange} style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: ativo ? cores.amarelo : "#e5e7eb", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: ativo ? "23px" : "3px", transition: "left 0.2s" }} />
    </button>
  )
}

function Secao({ icon: Icon, titulo, children }) {
  return (
    <div style={{ backgroundColor: cores.branco, borderRadius: "16px", marginBottom: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <Icon size={18} color={cores.roxo} />
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: cores.roxoEscuro }}>{titulo}</h3>
      </div>
      <div>{children}</div>
    </div>
  )
}

function ItemToggle({ label, desc, ativo, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}` }}>
      <div>
        <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{label}</p>
        {desc && <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{desc}</p>}
      </div>
      <Toggle ativo={ativo} onChange={onChange} />
    </div>
  )
}

function ItemAcao({ label, desc, onClick, icone: Icone }) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", borderBottom: `1px solid ${cores.fundo}`, cursor: "pointer", textAlign: "left" }}>
      <div>
        <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{label}</p>
        {desc && <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{desc}</p>}
      </div>
      {Icone ? <Icone size={16} color={cores.lavanda} /> : <ChevronRight size={16} color={cores.lavanda} />}
    </button>
  )
}

export default function Configuracoes() {
  const pathname = usePathname()
  const router = useRouter()
  const [notifs, setNotifs] = useState({ ativo: true, som: true, vibracao: true })
  const [modoEscuro, setModoEscuro] = useState(false)
  const [idioma, setIdioma] = useState("pt-BR")

  function toggle(key) { setNotifs(prev => ({ ...prev, [key]: !prev[key] })) }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px 120px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: cores.roxoEscuro, margin: "0 0 4px" }}>Configurações</h2>
        <p style={{ color: cores.lavanda, fontSize: "13px", marginBottom: "24px" }}>Personalize sua experiência no Artemis</p>

        {/* Notificações */}
        <Secao icon={Bell} titulo="Notificações">
          <ItemToggle label="Ativar notificações" desc="Receba alertas e atualizações importantes" ativo={notifs.ativo} onChange={() => toggle("ativo")} />
          <ItemToggle label="Som" desc="Toque sonoro para notificações" ativo={notifs.som} onChange={() => toggle("som")} />
          <ItemToggle label="Vibração" desc="Vibrar ao receber notificações" ativo={notifs.vibracao} onChange={() => toggle("vibracao")} />
        </Secao>

        {/* Aparência */}
        <Secao icon={Moon} titulo="Aparência">
          <ItemToggle label="Modo escuro" desc="Interface com cores claras" ativo={modoEscuro} onChange={() => setModoEscuro(!modoEscuro)} />
        </Secao>

        {/* Idioma */}
        <Secao icon={Globe} titulo="Idioma">
          <div style={{ padding: "14px 20px" }}>
            <select value={idioma} onChange={(e) => setIdioma(e.target.value)} style={{ width: "100%", border: `1px solid #E8E0F5`, borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: cores.roxoEscuro, outline: "none", backgroundColor: cores.fundo, cursor: "pointer" }}>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </Secao>

        {/* Dados */}
        <Secao icon={HardDrive} titulo="Dados e Armazenamento">
          <ItemAcao label="Limpar cache" desc="Libere 245 MB de espaço" onClick={() => alert("Cache limpo!")} />
          <ItemAcao label="Backup automático" desc="Último backup: há 2 dias" onClick={() => alert("Em breve!")} />
        </Secao>

        {/* Suporte */}
        <Secao icon={HelpCircle} titulo="Suporte e Ajuda">
          <ItemAcao label="Central de ajuda" desc="Perguntas frequentes e tutoriais" onClick={() => {}} icone={HelpCircle} />
          <ItemAcao label="Termos de uso" desc="Leia nossos termos e condições" onClick={() => {}} icone={FileText} />
          <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>Versão do aplicativo</p>
            <p style={{ margin: 0, fontSize: "13px", color: cores.lavanda }}>v2.4.1 (Build 245)</p>
          </div>
        </Secao>

        {/* Sair */}
        <button onClick={async () => { await signOut(auth); router.push("/") }} style={{ width: "100%", padding: "14px", backgroundColor: "rgba(239,68,68,0.06)", color: "#ef4444", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
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
            <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent" }}><item.icon size={20} /></div>
            <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}