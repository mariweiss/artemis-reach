"use client"

import { useState, useEffect } from "react"
import { auth } from "../firebase"
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Shield, Fingerprint, Key, AlertCircle, Monitor, Smartphone, Eye, EyeOff, Check, ChevronRight } from "lucide-react"
import Header from "../componentes/Header"

const cores = { fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F", roxoClaro: "#BB99FF", lavanda: "#8575BD", amarelo: "#FDEA72", branco: "#FFFFFF" }
const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

function Toggle({ ativo, onChange }: any) {
  return (
    <button onClick={onChange} style={{ width: "44px", height: "24px", borderRadius: "12px", backgroundColor: ativo ? cores.amarelo : "#e5e7eb", border: "none", cursor: "pointer", position: "relative", transition: "background-color 0.2s", flexShrink: 0 }}>
      <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "white", position: "absolute", top: "3px", left: ativo ? "23px" : "3px", transition: "left 0.2s" }} />
    </button>
  )
}

function Secao({ icon: Icon, titulo, children, corFundo }: any) {
  return (
    <div style={{ backgroundColor: corFundo || cores.branco, borderRadius: "16px", marginBottom: "16px", overflow: "hidden", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
      {titulo && (
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}`, display: "flex", alignItems: "center", gap: "10px" }}>
          {Icon && <Icon size={18} color={cores.roxo} />}
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: cores.roxoEscuro }}>{titulo}</h3>
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}

export default function Seguranca() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [configs, setConfigs] = useState({ doisFatores: true, biometrico: true, sosAtivo: true, alertaAuto: false })
  const [modalSenha, setModalSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [mostrar, setMostrar] = useState(false)
  const [msg, setMsg] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
    })
    return () => unsub()
  }, [])

  function toggle(key) { setConfigs(prev => ({ ...prev, [key]: !prev[key] })) }

  async function alterarSenha() {
    if (novaSenha.length < 6) { setMsg("Senha deve ter pelo menos 6 caracteres."); return }
    setSalvando(true)
    try {
      const cred = EmailAuthProvider.credential(usuario.email, senhaAtual)
      await reauthenticateWithCredential(usuario, cred)
      await updatePassword(usuario, novaSenha)
      setMsg("Senha alterada!")
      setModalSenha(false)
      setSenhaAtual(""); setNovaSenha("")
    } catch { setMsg("Senha atual incorreta.") }
    setSalvando(false)
    setTimeout(() => setMsg(""), 3000)
  }

  const ultimaAlteracao = usuario?.metadata?.lastSignInTime
    ? new Date(usuario.metadata.lastSignInTime).toLocaleDateString("pt-BR")
    : "nunca"

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px 120px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: cores.roxoEscuro, margin: "0 0 4px" }}>Segurança</h2>
        <p style={{ color: cores.lavanda, fontSize: "13px", marginBottom: "24px" }}>Configure suas proteções de segurança</p>

        {/* Banner conta protegida */}
        <div style={{ backgroundColor: `rgba(253,234,114,0.3)`, borderRadius: "14px", padding: "14px 18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", border: `1px solid rgba(253,234,114,0.5)` }}>
          <Check size={18} color={cores.roxoEscuro} />
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro }}>Conta Protegida</p>
            <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>Suas configurações de segurança estão ativas e sua conta está protegida.</p>
          </div>
        </div>

        {/* Autenticação */}
        <Secao icon={Shield} titulo="Autenticação">
          {[
            { key: "doisFatores", label: "Autenticação de dois fatores", desc: "Adiciona uma camada extra de proteção ao fazer login" },
            { key: "biometrico", label: "Login biométrico", desc: "Use sua digital ou reconhecimento facial" },
          ].map(item => (
            <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}` }}>
              <div>
                <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{item.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
              </div>
              <Toggle ativo={configs[item.key]} onChange={() => toggle(item.key)} />
            </div>
          ))}
          <button onClick={() => setModalSenha(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>Alterar senha</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>Última alteração há 3 meses</p>
            </div>
            <ChevronRight size={16} color={cores.lavanda} />
          </button>
        </Secao>

        {/* Alertas */}
        <Secao icon={AlertCircle} titulo="Alertas de Emergência">
          {[
            { key: "sosAtivo", label: "Botão SOS ativado", desc: "Notifica seu círculo e contatos de emergência" },
            { key: "alertaAuto", label: "Alerta automático", desc: "Detecta situações de risco e alerta automaticamente" },
          ].map(item => (
            <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${cores.fundo}` }}>
              <div>
                <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{item.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
              </div>
              <Toggle ativo={configs[item.key]} onChange={() => toggle(item.key)} />
            </div>
          ))}
          <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "rgba(239,68,68,0.04)", border: "none", cursor: "pointer" }}>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#dc2626" }}>Testar Alerta SOS</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>Simula um alerta sem notificar contatos</p>
            </div>
            <Bell size={16} color="#dc2626" />
          </button>
        </Secao>

        {/* Dispositivos */}
        <Secao icon={Monitor} titulo="Dispositivos Conectados">
          {[
            { nome: "Este dispositivo", desc: `${navigator?.userAgent?.includes("iPhone") ? "iPhone" : "Computador"} • Último acesso: Agora`, badge: "Ativo", cor: "#16a34a" },
            { nome: "Artemis Echo #A2B4", desc: "Dispositivo pareado em 11/04/2026", badge: "Conectado", cor: cores.roxo },
          ].map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i === 0 ? `1px solid ${cores.fundo}` : "none" }}>
              <div>
                <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro, fontWeight: "600" }}>{d.nome}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>{d.desc}</p>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: d.cor, backgroundColor: `${d.cor}15`, padding: "4px 10px", borderRadius: "10px" }}>{d.badge}</span>
            </div>
          ))}
        </Secao>

        {/* Encerrar sessões */}
        <button onClick={() => { signOut(auth); router.push("/") }} style={{ width: "100%", padding: "14px 20px", backgroundColor: cores.branco, border: "none", borderRadius: "14px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", boxShadow: "0 1px 4px rgba(90,73,151,0.06)", marginBottom: "16px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#dc2626", fontWeight: "600" }}>Encerrar todas as sessões</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: cores.lavanda }}>Desconecta todos os dispositivos exceto este</p>
        </button>

        {msg && <p style={{ textAlign: "center", color: msg.includes("incorreta") ? "#ef4444" : "#16a34a", fontSize: "13px", marginBottom: "12px" }}>{msg}</p>}

        <button style={{ width: "100%", padding: "14px", backgroundColor: cores.roxo, color: cores.branco, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
          Salvar Configurações
        </button>
      </div>

      {/* Modal senha */}
      {modalSenha && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ backgroundColor: cores.branco, width: "100%", borderRadius: "24px 24px 0 0", padding: "24px", boxShadow: "0 -4px 24px rgba(90,73,151,0.15)" }}>
            <h3 style={{ color: cores.roxoEscuro, margin: "0 0 20px", fontSize: "17px" }}>Alterar senha</h3>
            {[{ label: "Senha atual", value: senhaAtual, set: setSenhaAtual }, { label: "Nova senha", value: novaSenha, set: setNovaSenha }].map((c, i) => (
              <div key={i} style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", color: cores.lavanda, display: "block", marginBottom: "6px" }}>{c.label}</label>
                <div style={{ display: "flex", alignItems: "center", border: `1.5px solid #E8E0F5`, borderRadius: "10px", padding: "10px 14px" }}>
                  <input type={mostrar ? "text" : "password"} value={c.value} onChange={(e) => c.set(e.target.value)} style={{ border: "none", outline: "none", flex: 1, fontSize: "14px", color: "#333", background: "transparent" }} />
                  <button onClick={() => setMostrar(!mostrar)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    {mostrar ? <EyeOff size={16} color={cores.lavanda} /> : <Eye size={16} color={cores.lavanda} />}
                  </button>
                </div>
              </div>
            ))}
            {msg && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "10px" }}>{msg}</p>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setModalSenha(false)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: `1px solid ${cores.roxoClaro}`, background: "transparent", color: cores.roxo, cursor: "pointer", fontSize: "14px" }}>Cancelar</button>
              <button onClick={alterarSenha} disabled={salvando} style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: cores.roxo, color: cores.branco, cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>{salvando ? "Salvando..." : "Alterar"}</button>
            </div>
          </div>
        </div>
      )}

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