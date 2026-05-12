"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import { User, MapPin, Users, MessageSquare, Home, Bell, Camera, Phone, Mail, Edit2, Check, X } from "lucide-react"
import Link from "next/link"
import Header from "../componentes/Header"

const cores = { fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F", roxoClaro: "#BB99FF", lavanda: "#8575BD", branco: "#FFFFFF" }
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
  const [dados, setDados] = useState({ nome: "", email: "", telefone: "" })
  const [editando, setEditando] = useState(null)
  const [valorEdit, setValorEdit] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
      const snap = await getDoc(doc(db, "usuarios", user.uid))
      if (snap.exists()) setDados({ nome: snap.data().nome || "", email: user.email || "", telefone: snap.data().telefone || "" })
    })
    return () => unsub()
  }, [])

  async function salvar(campo) {
    setSalvando(true)
    try {
      if (campo === "nome" || campo === "telefone") {
        await updateDoc(doc(db, "usuarios", usuario.uid), { [campo]: valorEdit })
        setDados(prev => ({ ...prev, [campo]: valorEdit }))
      }
      setMsg("Salvo com sucesso!")
      setTimeout(() => setMsg(""), 2000)
    } catch { setMsg("Erro ao salvar.") }
    setSalvando(false)
    setEditando(null)
  }

  function iniciarEdicao(campo) {
    setEditando(campo)
    setValorEdit(dados[campo])
  }

  const campos = [
    { id: "nome", label: "Nome completo", icon: User, editavel: true },
    { id: "email", label: "Email", icon: Mail, editavel: false },
    { id: "telefone", label: "Telefone", icon: Phone, editavel: true },
  ]

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Meu Perfil</h2>
        <p style={{ color: cores.lavanda, marginBottom: "24px", fontSize: "14px" }}>Gerencie suas informações pessoais</p>

        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: "96px", height: "96px", borderRadius: "50%",
              backgroundColor: cores.roxoClaro, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "36px", fontWeight: "800", color: cores.roxoEscuro,
              border: `4px solid ${cores.branco}`,
              boxShadow: "0 4px 16px rgba(90,73,151,0.2)"
            }}>
              {dados.nome?.charAt(0).toUpperCase() || "?"}
            </div>
            <button style={{
              position: "absolute", bottom: 0, right: 0,
              width: "32px", height: "32px", borderRadius: "50%",
              backgroundColor: cores.roxo, border: `3px solid ${cores.branco}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
              <Camera size={14} color="white" />
            </button>
          </div>
          <p style={{ color: cores.roxoEscuro, fontWeight: "700", fontSize: "18px", margin: "12px 0 0" }}>{dados.nome}</p>
          <p style={{ color: cores.lavanda, fontSize: "13px", margin: "4px 0 0" }}>{dados.email}</p>
        </div>

        {/* Campos */}
        {campos.map((campo) => (
          <div key={campo.id} style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "16px", marginBottom: "12px",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  backgroundColor: cores.fundo, display: "flex",
                  alignItems: "center", justifyContent: "center"
                }}>
                  <campo.icon size={18} color={cores.roxo} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "11px", color: cores.lavanda }}>{campo.label}</p>
                  {editando === campo.id ? (
                    <input
                      value={valorEdit}
                      onChange={(e) => setValorEdit(e.target.value)}
                      autoFocus
                      style={{
                        border: "none", outline: "none", fontSize: "15px",
                        color: cores.roxoEscuro, fontWeight: "600",
                        width: "100%", background: "transparent", marginTop: "2px"
                      }}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: "15px", color: cores.roxoEscuro, fontWeight: "600", marginTop: "2px" }}>
                      {dados[campo.id] || "Não informado"}
                    </p>
                  )}
                </div>
              </div>
              {campo.editavel && (
                editando === campo.id ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => salvar(campo.id)} style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      backgroundColor: "rgba(34,197,94,0.1)", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Check size={16} color="#16a34a" />
                    </button>
                    <button onClick={() => setEditando(null)} style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      backgroundColor: "rgba(239,68,68,0.1)", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <X size={16} color="#ef4444" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => iniciarEdicao(campo.id)} style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    backgroundColor: cores.fundo, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Edit2 size={14} color={cores.roxo} />
                  </button>
                )
              )}
            </div>
          </div>
        ))}

        {msg && (
          <p style={{ textAlign: "center", color: msg.includes("Erro") ? "#ef4444" : "#16a34a", fontSize: "13px", marginTop: "8px" }}>
            {msg}
          </p>
        )}
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