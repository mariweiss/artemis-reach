"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import { MapPin, Users, MessageSquare, Home, Bell, Search, Phone, Mail, MoreVertical, UserCheck } from "lucide-react"
import Link from "next/link"
import Header from "../componentes/Header"

const cores = { fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F", roxoClaro: "#BB99FF", lavanda: "#8575BD", branco: "#FFFFFF", amarelo: "#FDEA72" }
const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

export default function Contatos() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<User | null>(null)
  const [busca, setBusca] = useState("")
  const [conexoes, setConexoes] = useState<any[]>([])
  const [idsCirculo, setIdsCirculo] = useState<string[]>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!usuario) return
    const q = query(collection(db, "circulos"), where("usuarios", "array-contains", usuario.uid), where("status", "==", "confirmado"))
    const unsub = onSnapshot(q, async (snap) => {
      const { getDoc, doc } = await import("firebase/firestore")
      const ids: string[] = []
      const dados = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        const outroId = data.usuarios.find(id => id !== usuario.uid)
        ids.push(outroId)
        try {
          const perfil = await getDoc(doc(db, "usuarios", outroId))
          return { id: d.id, outroId, nome: perfil.data()?.nome || "Usuário", telefone: perfil.data()?.telefone || "", email: perfil.data()?.email || "", noCirculo: true }
        } catch { return { id: d.id, outroId, nome: "Usuário", telefone: "", email: "", noCirculo: true } }
      }))
      setIdsCirculo(ids)
      setConexoes(dados)
    })
    return () => unsub()
  }, [usuario])

  const contatosFiltrados = conexoes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase())
  )

  function iniciais(nome) {
    return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: cores.roxoEscuro, margin: "0 0 4px" }}>Contatos</h2>
        <p style={{ color: cores.lavanda, fontSize: "13px", marginBottom: "20px" }}>Gerencie seus contatos de confiança</p>

        {/* Busca */}
        <div style={{ backgroundColor: cores.branco, borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
          <Search size={18} color={cores.lavanda} />
          <input
            placeholder="Buscar contatos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ border: "none", outline: "none", flex: 1, fontSize: "14px", color: cores.roxoEscuro, background: "transparent" }}
          />
        </div>

        {/* Lista */}
        {contatosFiltrados.length === 0 ? (
          <div style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
            <Users size={36} color={cores.roxoClaro} style={{ marginBottom: "10px" }} />
            <p style={{ color: cores.lavanda, fontSize: "14px", margin: 0 }}>
              {busca ? "Nenhum contato encontrado." : "Nenhum contato no círculo ainda."}
            </p>
            <p style={{ color: "#bbb", fontSize: "12px", margin: "6px 0 0" }}>
              Vá em Círculo para adicionar contatos de confiança.
            </p>
          </div>
        ) : contatosFiltrados.map((contato) => (
          <div key={contato.id} style={{ backgroundColor: cores.branco, borderRadius: "14px", padding: "16px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "50%", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center", color: cores.roxo, fontWeight: "700", fontSize: "15px" }}>
                {iniciais(contato.nome)}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderRadius: "50%", backgroundColor: cores.amarelo, border: `2px solid ${cores.branco}` }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: cores.roxoEscuro }}>{contato.nome}</p>
                {contato.noCirculo && (
                  <span style={{ fontSize: "11px", color: cores.roxo, backgroundColor: `rgba(90,73,151,0.08)`, padding: "2px 8px", borderRadius: "10px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                    <UserCheck size={10} /> No seu círculo
                  </span>
                )}
              </div>
              {contato.telefone && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <Phone size={12} color={cores.lavanda} />
                  <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{contato.telefone}</p>
                </div>
              )}
              {contato.email && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={12} color={cores.lavanda} />
                  <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{contato.email}</p>
                </div>
              )}
            </div>

            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
              <MoreVertical size={18} color={cores.lavanda} />
            </button>
          </div>
        ))}
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