"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import { MapPin, Users, MessageSquare, Home, Bell, Camera, Phone, Mail, Edit2, Check, X, Calendar } from "lucide-react"
import Link from "next/link"
import Header from "../componentes/Header"

const cores = { fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F", roxoClaro: "#BB99FF", lavanda: "#8575BD", amarelo: "#FDEA72", branco: "#FFFFFF" }
const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

export default function Perfil() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [dados, setDados] = useState({ nome: "", email: "", telefone: "", endereco: "", nascimento: "", membroDesde: "" })
  const [contatoEmerg, setContatoEmerg] = useState({ nome: "", relacao: "", telefone: "" })
  const [editandoPessoal, setEditandoPessoal] = useState(false)
  const [editandoEmerg, setEditandoEmerg] = useState(false)
  const [dadosEdit, setDadosEdit] = useState({})
  const [emergEdit, setEmergEdit] = useState({})
  const [msg, setMsg] = useState("")
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
      const snap = await getDoc(doc(db, "usuarios", user.uid))
      if (snap.exists()) {
        const d = snap.data()
        const criado = user.metadata.creationTime
          ? new Date(user.metadata.creationTime).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
          : ""
        setDados({ nome: d.nome || "", email: user.email || "", telefone: d.telefone || "", endereco: d.endereco || "", nascimento: d.nascimento || "", membroDesde: criado })
        setContatoEmerg({ nome: d.contato_emergencia?.nome || "", relacao: d.contato_emergencia?.relacao || "", telefone: d.contato_emergencia?.telefone || "" })
      }
    })
    return () => unsub()
  }, [])

  function formatarTelefone(valor) {
    const nums = valor.replace(/\D/g, "").slice(0, 11)
    if (nums.length <= 2) return nums
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  }

  async function salvarPessoal() {
    setSalvando(true)
    try {
      await updateDoc(doc(db, "usuarios", usuario.uid), {
        nome: dadosEdit.nome, telefone: dadosEdit.telefone,
        endereco: dadosEdit.endereco, nascimento: dadosEdit.nascimento
      })
      setDados(prev => ({ ...prev, ...dadosEdit }))
      setEditandoPessoal(false)
      setMsg("Salvo com sucesso!")
      setTimeout(() => setMsg(""), 2000)
    } catch { setMsg("Erro ao salvar.") }
    setSalvando(false)
  }

  async function salvarEmerg() {
    setSalvando(true)
    try {
      await updateDoc(doc(db, "usuarios", usuario.uid), { contato_emergencia: emergEdit })
      setContatoEmerg(emergEdit)
      setEditandoEmerg(false)
      setMsg("Salvo com sucesso!")
      setTimeout(() => setMsg(""), 2000)
    } catch { setMsg("Erro ao salvar.") }
    setSalvando(false)
  }

  if (!usuario) return <Loading cores={cores} />

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: cores.roxoEscuro, margin: "0 0 4px" }}>Perfil</h2>
        <p style={{ color: cores.lavanda, fontSize: "13px", marginBottom: "24px" }}>Gerencie suas informações pessoais</p>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: "88px", height: "88px", borderRadius: "50%",
              backgroundColor: cores.fundo, border: `3px solid ${cores.amarelo}`,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#c4b5e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#5A4997"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
              </div>
            </div>
            <button style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderRadius: "50%", backgroundColor: cores.roxo, border: `2px solid ${cores.branco}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Camera size={13} color="white" />
            </button>
          </div>
          <p style={{ color: cores.roxoEscuro, fontWeight: "700", fontSize: "16px", margin: "10px 0 0" }}>{dados.nome || "Usuária"}</p>
          {dados.membroDesde && <p style={{ color: cores.lavanda, fontSize: "12px", margin: "3px 0 0" }}>Membro desde {dados.membroDesde}</p>}
        </div>

        {/* Informações Pessoais */}
        <div style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 6px rgba(90,73,151,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: cores.roxoEscuro, fontSize: "14px", fontWeight: "700", margin: 0 }}>Informações Pessoais</h3>
            {!editandoPessoal ? (
              <button onClick={() => { setEditandoPessoal(true); setDadosEdit({ nome: dados.nome, telefone: dados.telefone, endereco: dados.endereco, nascimento: dados.nascimento }) }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Edit2 size={16} color={cores.lavanda} />
              </button>
            ) : (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={salvarPessoal} disabled={salvando} style={{ background: "none", border: "none", cursor: "pointer" }}><Check size={18} color="#16a34a" /></button>
                <button onClick={() => setEditandoPessoal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="#ef4444" /></button>
              </div>
            )}
          </div>

          {[
            { icon: Mail, label: "Email", key: "email", editavel: false, tipo: "email" },
            { icon: Phone, label: "Telefone", key: "telefone", editavel: true, tipo: "tel" },
            { icon: MapPin, label: "Endereço", key: "endereco", editavel: true, tipo: "text" },
            { icon: Calendar, label: "Data de Nascimento", key: "nascimento", editavel: true, tipo: "date" },
          ].map((campo) => (
            <div key={campo.key} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <campo.icon size={16} color={cores.lavanda} style={{ marginTop: "2px", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px", fontSize: "11px", color: cores.lavanda }}>{campo.label}</p>
                {editandoPessoal && campo.editavel ? (
                  <input
                    type={campo.tipo}
                    value={campo.key === "telefone" ? dadosEdit[campo.key] || "" : dadosEdit[campo.key] || ""}
                    onChange={(e) => {
                      const val = campo.key === "telefone" ? formatarTelefone(e.target.value) : e.target.value
                      setDadosEdit(prev => ({ ...prev, [campo.key]: val }))
                    }}
                    maxLength={campo.key === "telefone" ? 15 : undefined}
                    style={{ border: "none", borderBottom: `1px solid ${cores.roxoClaro}`, outline: "none", fontSize: "14px", color: cores.roxoEscuro, width: "100%", padding: "2px 0", background: "transparent" }}
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{dados[campo.key] || "Não informado"}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contato de Emergência */}
        <div style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 6px rgba(90,73,151,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ color: cores.roxoEscuro, fontSize: "14px", fontWeight: "700", margin: 0 }}>Contato de Emergência</h3>
            {!editandoEmerg ? (
              <button onClick={() => { setEditandoEmerg(true); setEmergEdit({ ...contatoEmerg }) }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <Edit2 size={16} color={cores.lavanda} />
              </button>
            ) : (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={salvarEmerg} disabled={salvando} style={{ background: "none", border: "none", cursor: "pointer" }}><Check size={18} color="#16a34a" /></button>
                <button onClick={() => setEditandoEmerg(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="#ef4444" /></button>
              </div>
            )}
          </div>

          {[
            { label: "Nome", key: "nome", tipo: "text" },
            { label: "Relação", key: "relacao", tipo: "text" },
            { label: "Telefone", key: "telefone", tipo: "tel" },
          ].map((campo) => (
            <div key={campo.key} style={{ marginBottom: "14px" }}>
              <p style={{ margin: "0 0 2px", fontSize: "11px", color: cores.lavanda }}>{campo.label}</p>
              {editandoEmerg ? (
                <input
                  type={campo.tipo}
                  value={emergEdit[campo.key] || ""}
                  onChange={(e) => {
                    const val = campo.key === "telefone" ? formatarTelefone(e.target.value) : e.target.value
                    setEmergEdit(prev => ({ ...prev, [campo.key]: val }))
                  }}
                  maxLength={campo.key === "telefone" ? 15 : undefined}
                  style={{ border: "none", borderBottom: `1px solid ${cores.roxoClaro}`, outline: "none", fontSize: "14px", color: cores.roxoEscuro, width: "100%", padding: "2px 0", background: "transparent" }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: "14px", color: cores.roxoEscuro }}>{contatoEmerg[campo.key] || "Não informado"}</p>
              )}
            </div>
          ))}
        </div>

        {msg && <p style={{ textAlign: "center", color: msg.includes("Erro") ? "#ef4444" : "#16a34a", fontSize: "13px", marginBottom: "12px" }}>{msg}</p>}

        {/* Botões */}
        <button onClick={async () => { await salvarPessoal(); await salvarEmerg() }} style={{ width: "100%", padding: "14px", backgroundColor: cores.roxo, color: cores.branco, border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer", marginBottom: "10px" }}>
          Salvar Alterações
        </button>
        <button onClick={() => alert("Em breve!")} style={{ width: "100%", padding: "14px", backgroundColor: "rgba(239,68,68,0.06)", color: "#ef4444", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
          Excluir Conta
        </button>
      </div>
      <NavBar nav={nav} pathname={pathname} cores={cores} />
    </div>
  )
}

function Loading({ cores }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${cores.roxo}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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