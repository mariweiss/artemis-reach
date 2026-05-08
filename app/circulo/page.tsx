"use client"

import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, onSnapshot } from "firebase/firestore"
import { MapPin, Users, MessageSquare, Home, Bell } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Header from "../componentes/Header"

const cores = {
  fundo: "#EEEAF8",
  fundoCard: "#F5F2FC",
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

export default function Circulo() {
  const [contatos, setContatos] = useState([])
  const pathname = usePathname()

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "circulos"), (snapshot) => {
      setContatos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Meu Círculo</h2>
        <p style={{ color: cores.lavanda, marginBottom: "24px", fontSize: "14px" }}>
          Acompanhe as rotas frequentes das pessoas próximas
        </p>

        {contatos.length === 0 && (
          <div style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "32px", textAlign: "center",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)"
          }}>
            <Users size={40} color={cores.roxoClaro} style={{ marginBottom: "12px" }} />
            <p style={{ color: cores.lavanda, fontSize: "14px", margin: 0 }}>
              Nenhum contato no círculo ainda.
            </p>
            <p style={{ color: "#bbb", fontSize: "13px", marginTop: "8px" }}>
              Adicione pessoas para acompanhar a localização delas.
            </p>
          </div>
        )}

        {contatos.map((contato) => (
          <div key={contato.id} style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "16px", marginBottom: "12px",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                backgroundColor: cores.roxoClaro, display: "flex",
                alignItems: "center", justifyContent: "center",
                color: cores.roxoEscuro, fontWeight: "bold", fontSize: "16px"
              }}>
                {contato.nome?.charAt(0) || "?"}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: cores.roxoEscuro }}>
                  {contato.nome || "Contato"}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>
                  {contato.rotas || 0} rotas frequentes
                </p>
              </div>
            </div>
            <span style={{ color: cores.roxoClaro, fontSize: "20px" }}>›</span>
          </div>
        ))}
      </div>

      {/* Botão adicionar */}
      <div style={{
        position: "fixed", bottom: "70px", left: 0, right: 0,
        padding: "0 24px"
      }}>
        <button style={{
          width: "100%", padding: "16px",
          backgroundColor: cores.roxo, color: cores.branco,
          border: "none", borderRadius: "16px",
          fontSize: "15px", fontWeight: "bold",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(90,73,151,0.3)"
        }}>
          + Adicionar ao Círculo
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