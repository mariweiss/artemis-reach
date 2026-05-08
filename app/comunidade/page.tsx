"use client"

import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore"
import { MapPin, Users, MessageSquare, Home, Bell, Lock, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Header from "../componentes/Header"

const cores = {
  fundo: "#EEEAF8",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  lavanda: "#8575BD",
  branco: "#FFFFFF",
}

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

export default function Comunidade() {
  const [posts, setPosts] = useState([])
  const [texto, setTexto] = useState("")
  const [anonimo, setAnonimo] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("criado_em", "desc"))
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  async function publicar() {
    if (!texto.trim()) return
    await addDoc(collection(db, "posts"), {
      texto, anonimo,
      nome: anonimo ? "Anônimo" : "Maria Silva",
      criado_em: serverTimestamp()
    })
    setTexto("")
    setModalAberto(false)
  }

  function formatarData(timestamp) {
    if (!timestamp?.seconds) return "agora"
    const diff = Math.floor((Date.now() - timestamp.seconds * 1000) / 60000)
    if (diff < 1) return "agora"
    if (diff < 60) return `${diff}min atrás`
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
    return `${Math.floor(diff / 1440)}d atrás`
  }

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 160px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Comunidade</h2>
        <p style={{ color: cores.lavanda, marginBottom: "24px", fontSize: "14px" }}>
          Compartilhe experiências e dicas de segurança
        </p>

        {posts.filter(p => p.criado_em).map((post) => (
          <div key={post.id} style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "16px", marginBottom: "12px",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                backgroundColor: post.anonimo ? "#e5e7eb" : cores.fundo,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                {post.anonimo
                  ? <Lock size={18} color={cores.lavanda} />
                  : <User size={18} color={cores.roxo} />
                }
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: cores.roxoEscuro }}>
                  {post.nome}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#bbb" }}>
                  {formatarData(post.criado_em)}
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.6", color: "#444" }}>
              {post.texto}
            </p>
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <MessageSquare size={14} color={cores.lavanda} />
              <span style={{ fontSize: "12px", color: cores.lavanda }}>
                {post.respostas || 0} respostas
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal nova publicação */}
      {modalAberto && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 200, display: "flex", alignItems: "flex-end"
        }}>
          <div style={{
            backgroundColor: cores.branco, width: "100%",
            borderRadius: "24px 24px 0 0", padding: "24px",
            boxShadow: "0 -4px 24px rgba(90,73,151,0.15)"
          }}>
            <h3 style={{ color: cores.roxoEscuro, margin: "0 0 16px", fontSize: "17px" }}>
              Nova Publicação
            </h3>
            <textarea
              placeholder="Compartilhe uma experiência ou dica de segurança..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoFocus
              style={{
                width: "100%", padding: "14px 16px",
                borderRadius: "12px", border: `1.5px solid #E8E0F5`,
                marginBottom: "12px", resize: "none",
                fontFamily: "sans-serif", fontSize: "14px",
                boxSizing: "border-box", outline: "none", color: "#333"
              }}
              rows={4}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{
                fontSize: "13px", color: cores.lavanda,
                display: "flex", alignItems: "center", gap: "6px", cursor: "pointer"
              }}>
                <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
                Publicar anonimamente
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setModalAberto(false)} style={{
                  padding: "10px 20px", borderRadius: "12px",
                  border: `1px solid ${cores.roxoClaro}`, backgroundColor: "transparent",
                  color: cores.roxo, cursor: "pointer", fontSize: "14px"
                }}>
                  Cancelar
                </button>
                <button onClick={publicar} style={{
                  padding: "10px 20px", borderRadius: "12px",
                  border: "none", backgroundColor: cores.roxo,
                  color: cores.branco, cursor: "pointer",
                  fontSize: "14px", fontWeight: "600"
                }}>
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão nova publicação */}
      <div style={{
        position: "fixed", bottom: "70px", left: 0, right: 0, padding: "0 24px"
      }}>
        <button onClick={() => setModalAberto(true)} style={{
          width: "100%", padding: "16px",
          backgroundColor: cores.roxo, color: cores.branco,
          border: "none", borderRadius: "16px",
          fontSize: "15px", fontWeight: "bold",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(90,73,151,0.3)"
        }}>
          + Nova Publicação
        </button>
      </div>

      {/* Navegação inferior */}
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
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: "4px",
              textDecoration: "none",
              color: ativo ? cores.roxo : "#aaa",
            }}>
              <div style={{
                padding: "6px 16px", borderRadius: "12px",
                backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent"
              }}>
                <item.icon size={20} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}