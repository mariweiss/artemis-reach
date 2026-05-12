"use client"

import { useState, useEffect } from "react"
import { auth } from "../firebase"
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Users, MessageSquare, Home, Bell, Shield, Smartphone, Key, Fingerprint, AlertCircle, Monitor, LogOut, Eye, EyeOff, Check } from "lucide-react"
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
      border: "none", cursor: "pointer", position: "relative",
      transition: "background-color 0.2s", flexShrink: 0
    }}>
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%",
        backgroundColor: "white", position: "absolute", top: "3px",
        left: ativo ? "23px" : "3px", transition: "left 0.2s"
      }} />
    </button>
  )
}

export default function Seguranca() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [configs, setConfigs] = useState({ doisFatores: false, biometrico: false, alertasAuto: true, sosAtivado: true })
  const [modalSenha, setModalSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [msg, setMsg] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
    })
    return () => unsub()
  }, [])

  function toggle(key) {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function alterarSenha() {
    if (novaSenha.length < 6) { setMsg("Senha deve ter pelo menos 6 caracteres."); return }
    setSalvando(true)
    try {
      const cred = EmailAuthProvider.credential(usuario.email, senhaAtual)
      await reauthenticateWithCredential(usuario, cred)
      await updatePassword(usuario, novaSenha)
      setMsg("Senha alterada com sucesso!")
      setModalSenha(false)
      setSenhaAtual(""); setNovaSenha("")
    } catch {
      setMsg("Senha atual incorreta.")
    }
    setSalvando(false)
    setTimeout(() => setMsg(""), 3000)
  }

  const dispositivos = [
    { nome: "Chrome — Windows", local: "Santa Rita do Sapucaí, BR", ativo: true },
    { nome: "Artemis Echo", local: "Pareado via Bluetooth", ativo: true },
  ]

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Segurança</h2>
        <p style={{ color: cores.lavanda, marginBottom: "24px", fontSize: "14px" }}>
          Proteja sua conta e configure alertas de emergência
        </p>

        {/* Autenticação */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Autenticação
        </p>
        {[
          { key: "doisFatores", icon: Shield, label: "Autenticação de dois fatores", desc: "Código extra ao fazer login" },
          { key: "biometrico", icon: Fingerprint, label: "Login biométrico", desc: "Use impressão digital ou Face ID" },
        ].map((item) => (
          <div key={item.key} style={{
            backgroundColor: cores.branco, borderRadius: "14px",
            padding: "14px 16px", marginBottom: "8px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
          }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <item.icon size={18} color={cores.roxo} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
            </div>
            <Toggle ativo={configs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}

        {/* Alertas */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Alertas de emergência
        </p>
        {[
          { key: "sosAtivado", icon: AlertCircle, label: "Botão SOS ativado", desc: "Pressione e segure para acionar" },
          { key: "alertasAuto", icon: Bell, label: "Alertas automáticos", desc: "Notificar círculo em áreas de risco" },
        ].map((item) => (
          <div key={item.key} style={{
            backgroundColor: cores.branco, borderRadius: "14px",
            padding: "14px 16px", marginBottom: "8px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
          }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <item.icon size={18} color={cores.roxo} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{item.label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{item.desc}</p>
            </div>
            <Toggle ativo={configs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}

        {/* Alterar senha */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Senha
        </p>
        <button onClick={() => setModalSenha(true)} style={{
          width: "100%", backgroundColor: cores.branco, borderRadius: "14px",
          padding: "14px 16px", marginBottom: "8px",
          display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 1px 4px rgba(90,73,151,0.06)", border: "none", cursor: "pointer"
        }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Key size={18} color={cores.roxo} />
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>Alterar senha</p>
            <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>Última alteração: nunca</p>
          </div>
        </button>

        {msg && <p style={{ textAlign: "center", color: msg.includes("sucesso") ? "#16a34a" : "#ef4444", fontSize: "13px" }}>{msg}</p>}

        {/* Dispositivos */}
        <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Dispositivos conectados
        </p>
        {dispositivos.map((d, i) => (
          <div key={i} style={{
            backgroundColor: cores.branco, borderRadius: "14px",
            padding: "14px 16px", marginBottom: "8px",
            display: "flex", alignItems: "center", gap: "12px",
            boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
          }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Monitor size={18} color={cores.roxo} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>{d.nome}</p>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{d.local}</p>
            </div>
            {d.ativo && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} />}
          </div>
        ))}

        {/* Sair */}
        <button onClick={async () => { await signOut(auth); router.push("/") }} style={{
          width: "100%", marginTop: "8px", padding: "14px",
          backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444",
          border: "1px solid rgba(239,68,68,0.2)", borderRadius: "14px",
          fontSize: "14px", fontWeight: "600", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}>
          <LogOut size={18} /> Encerrar todas as sessões
        </button>
      </div>

      {/* Modal senha */}
      {modalSenha && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ backgroundColor: cores.branco, width: "100%", borderRadius: "24px 24px 0 0", padding: "24px", boxShadow: "0 -4px 24px rgba(90,73,151,0.15)" }}>
            <h3 style={{ color: cores.roxoEscuro, margin: "0 0 20px", fontSize: "17px" }}>Alterar senha</h3>
            {[
              { label: "Senha atual", value: senhaAtual, set: setSenhaAtual },
              { label: "Nova senha", value: novaSenha, set: setNovaSenha },
            ].map((campo, i) => (
              <div key={i} style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro, display: "block", marginBottom: "8px" }}>{campo.label}</label>
                <div style={{ display: "flex", alignItems: "center", border: `1.5px solid #E8E0F5`, borderRadius: "12px", padding: "12px 16px" }}>
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    value={campo.value}
                    onChange={(e) => campo.set(e.target.value)}
                    style={{ border: "none", outline: "none", flex: 1, fontSize: "14px", color: "#333", background: "transparent" }}
                  />
                  <button onClick={() => setMostrarSenha(!mostrarSenha)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    {mostrarSenha ? <EyeOff size={16} color={cores.lavanda} /> : <Eye size={16} color={cores.lavanda} />}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setModalSenha(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${cores.roxoClaro}`, backgroundColor: "transparent", color: cores.roxo, cursor: "pointer", fontSize: "14px" }}>
                Cancelar
              </button>
              <button onClick={alterarSenha} disabled={salvando} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: cores.roxo, color: cores.branco, cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                {salvando ? "Salvando..." : "Alterar senha"}
              </button>
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