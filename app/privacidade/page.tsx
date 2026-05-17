"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Navigation, Eye, UserCheck, EyeOff, Shield, Download, Trash2 } from "lucide-react"
import Header from "../componentes/Header"

const cores = { fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F", roxoClaro: "#BB99FF", lavanda: "#8575BD", amarelo: "#FDEA72", branco: "#FFFFFF" }
const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

function Toggle({ ativo, onChange, amarelo }: any) {
  return (
    <button onClick={onChange} style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: ativo ? (amarelo ? cores.amarelo : cores.roxo) : "#e5e7eb", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: ativo ? "23px" : "3px", transition: "left 0.2s" }} />
    </button>
  )
}

function Secao({ icon: Icon, titulo, children }: any) {
  return (
    <div style={{ backgroundColor: cores.branco, borderRadius: "16px", marginBottom: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${cores.fundo}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <Icon size={18} color={cores.roxo} />
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: cores.roxoEscuro }}>{titulo}</h3>
      </div>
      <div style={{ padding: "4px 0" }}>{children}</div>
    </div>
  )
}

function Item({ label, desc, ativo, onChange }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}` }}>
      <div>
        <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{label}</p>
        {desc && <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{desc}</p>}
      </div>
      <Toggle ativo={ativo} onChange={onChange} amarelo />
    </div>
  )
}

function ItemAcao({ label, desc, onClick }: any) {
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", flexDirection: "column", padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}`, background: "none", border: "none", borderBottom: `1px solid ${cores.fundo}`, cursor: "pointer", textAlign: "left" }}>
      <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{label}</p>
      {desc && <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{desc}</p>}
    </button>
  )
}

export default function Privacidade() {
  const pathname = usePathname()
  const [configs, setConfigs] = useState({
    locReal: true, rotasFreq: true, historico: true,
    statusOnline: true, convites: true, anonimo: false
  })

  function toggle(key) { setConfigs(prev => ({ ...prev, [key]: !prev[key] })) }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px 120px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: cores.roxoEscuro, margin: "0 0 4px" }}>Privacidade</h2>
        <p style={{ color: cores.lavanda, fontSize: "13px", marginBottom: "24px" }}>Controle quem pode ver suas informações</p>

        <Secao icon={Navigation} titulo="Localização">
          <Item label="Compartilhar localização em tempo real" desc="Permite que seu círculo veja onde você está" ativo={configs.locReal} onChange={() => toggle("locReal")} />
          <Item label="Compartilhar rotas frequentes" desc="Seu círculo pode ver suas rotas mais usadas" ativo={configs.rotasFreq} onChange={() => toggle("rotasFreq")} />
          <Item label="Salvar histórico de localização" desc="Mantém registro dos locais visitados" ativo={configs.historico} onChange={() => toggle("historico")} />
        </Secao>

        <Secao icon={Users} titulo="Social">
          <Item label="Mostrar status online" desc="Seu círculo pode ver quando você está online" ativo={configs.statusOnline} onChange={() => toggle("statusOnline")} />
          <Item label="Permitir convites para círculo" desc="Outras usuárias podem te convidar para o círculo delas" ativo={configs.convites} onChange={() => toggle("convites")} />
          <Item label="Publicações anônimas por padrão" desc="Suas publicações na comunidade serão anônimas" ativo={configs.anonimo} onChange={() => toggle("anonimo")} />
        </Secao>

        <Secao icon={Shield} titulo="Gerenciamento de Dados">
          <ItemAcao label="Baixar meus dados" desc="Obtenha uma cópia de todas as suas informações" onClick={() => alert("Em breve!")} />
          <ItemAcao label="Limpar histórico de localização" desc="Remove todos os registros de localizações anteriores" onClick={() => alert("Em breve!")} />
        </Secao>

        <button style={{ width: "100%", padding: "14px", backgroundColor: cores.roxo, color: cores.branco, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
          Salvar Preferências
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