"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Eye, EyeOff, Navigation, Shield, UserCheck, Lock, Trash2, Download } from "lucide-react"
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
    <button onClick={onChange} style={{
      width: "44px", height: "24px", borderRadius: "12px",
      backgroundColor: ativo ? cores.roxo : "#e5e7eb",
      border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
      transition: "background-color 0.2s"
    }}>
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%",
        backgroundColor: "white", position: "absolute", top: "3px",
        left: ativo ? "23px" : "3px", transition: "left 0.2s"
      }} />
    </button>
  )
}

export default function Privacidade() {
  const pathname = usePathname()
  const [configs, setConfigs] = useState({
    localizacaoTempReal: true,
    rotasFrequentes: false,
    statusOnline: true,
    convitesCirculo: true,
    publicacoesAnonimas: true,
  })

  function toggle(key) {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const secoes = [
    {
      titulo: "Compartilhamento de localização",
      itens: [
        { key: "localizacaoTempReal", icon: Navigation, label: "Localização em tempo real", desc: "Compartilhar com seu círculo de confiança" },
        { key: "rotasFrequentes", icon: MapPin, label: "Rotas frequentes", desc: "Mostrar áreas aproximadas (sem endereços exatos)" },
        { key: "statusOnline", icon: Eye, label: "Status online", desc: "Mostrar quando você está ativa no app" },
      ]
    },
    {
      titulo: "Interações",
      itens: [
        { key: "convitesCirculo", icon: UserCheck, label: "Aceitar convites para círculo", desc: "Receber solicitações de novas conexões" },
        { key: "publicacoesAnonimas", icon: EyeOff, label: "Publicações anônimas", desc: "Permitir ocultar seu nome em posts da comunidade" },
      ]
    }
  ]

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Privacidade</h2>
        <p style={{ color: cores.lavanda, marginBottom: "24px", fontSize: "14px" }}>
          Controle o que você compartilha e com quem
        </p>

        {secoes.map((secao, si) => (
          <div key={si} style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {secao.titulo}
            </p>
            {secao.itens.map((item) => (
              <div key={item.key} style={{
                backgroundColor: cores.branco, borderRadius: "14px",
                padding: "14px 16px", marginBottom: "8px",
                display: "flex", alignItems: "center", gap: "12px",
                boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
              }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  backgroundColor: cores.fundo, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <item.icon size={18} color={cores.roxo} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
                </div>
                <Toggle ativo={configs[item.key]} onChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        ))}

        {/* Gerenciamento de dados */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Gerenciamento de dados
        </p>
        {[
          { icon: Download, label: "Baixar meus dados", desc: "Exportar todas suas informações", cor: cores.roxo, acao: () => alert("Em breve!") },
          { icon: Trash2, label: "Limpar histórico", desc: "Apagar rotas e atividades salvas", cor: "#d97706", acao: () => alert("Em breve!") },
          { icon: Lock, label: "Excluir conta", desc: "Remover permanentemente sua conta", cor: "#ef4444", acao: () => alert("Em breve!") },
        ].map((item, i) => (
          <button key={i} onClick={item.acao} style={{
            width: "100%", backgroundColor: cores.branco, borderRadius: "14px",
            padding: "14px 16px", marginBottom: "8px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 1px 4px rgba(90,73,151,0.06)",
            border: "none", cursor: "pointer", textAlign: "left"
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              backgroundColor: `${item.cor}15`, display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
              <item.icon size={18} color={item.cor} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: item.cor }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <NavBar nav={nav} pathname={pathname} cores={cores} />
    </div>
  )
}

function NavBar({ nav, pathname, cores }) {
  return (
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
  )
}