"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { MapPin, X, Smartphone, User, Users, Lock, Shield, Settings, Home } from "lucide-react"
import Link from "next/link"

const cores = {
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  fundo: "#EEEAF8",
  branco: "#FFFFFF",
}

const menuItens = [
  { icon: Smartphone, label: "Dispositivo Echo", href: "/dispositivo", destaque: true },
  { icon: User, label: "Perfil", href: "/perfil" },
  { icon: Lock, label: "Privacidade", href: "/privacidade" },
  { icon: Shield, label: "Segurança", href: "/seguranca" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
  { icon: Home, label: "Tela Inicial", href: "/inicio" },
]

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false)
  const router = useRouter()

  async function sair() {
    await signOut(auth)
    router.push("/")
  }

  return (
    <>
      {/* Header */}
      <div style={{
        backgroundColor: cores.branco, padding: "14px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 1px 4px rgba(90,73,151,0.08)",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <Link href="/inicio" style={{
          display: "flex", alignItems: "center", gap: "10px",
          textDecoration: "none"
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            backgroundColor: cores.roxo, display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <MapPin size={16} color={cores.branco} />
          </div>
          <span style={{ fontWeight: "bold", fontSize: "17px", color: cores.roxoEscuro }}>
            Artemis
          </span>
        </Link>

        <button
          onClick={() => setMenuAberto(true)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", gap: "5px", padding: "4px"
          }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: "22px", height: "2px",
              backgroundColor: cores.roxoEscuro, borderRadius: "2px"
            }} />
          ))}
        </button>
      </div>

      {/* Overlay */}
      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          style={{
            position: "fixed", inset: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 200
          }}
        />
      )}

      {/* Menu lateral */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "280px",
        backgroundColor: cores.branco,
        zIndex: 300, padding: "0",
        transform: menuAberto ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease",
        boxShadow: "-4px 0 24px rgba(90,73,151,0.15)",
        display: "flex", flexDirection: "column"
      }}>
        {/* Topo do menu */}
        <div style={{
          padding: "20px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: `1px solid ${cores.fundo}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              backgroundColor: cores.roxo, display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
              <MapPin size={14} color={cores.branco} />
            </div>
            <span style={{ fontWeight: "bold", fontSize: "15px", color: cores.roxoEscuro }}>
              Artemis
            </span>
          </div>
          <button
            onClick={() => setMenuAberto(false)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              width: "32px", height: "32px", borderRadius: "50%",
              backgroundColor: cores.fundo, display: "flex",
              alignItems: "center", justifyContent: "center"
            }}>
            <X size={18} color={cores.roxoEscuro} />
          </button>
        </div>

        {/* Itens do menu */}
        <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          {menuItens.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              onClick={() => setMenuAberto(false)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 24px", textDecoration: "none",
                color: item.destaque ? cores.roxo : cores.roxoEscuro,
                fontWeight: item.destaque ? "600" : "400",
                fontSize: "15px",
                borderBottom: i === 0 ? `1px solid ${cores.fundo}` : "none"
              }}>
              <item.icon size={20} color={item.destaque ? cores.roxo : cores.roxoEscuro} />
              {item.label}
              {item.destaque && (
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  backgroundColor: cores.roxo, marginLeft: "auto"
                }} />
              )}
            </Link>
          ))}
        </div>

        {/* Sair */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${cores.fundo}` }}>
          <button
            onClick={sair}
            style={{
              width: "100%", padding: "12px",
              backgroundColor: cores.fundo, color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer"
            }}>
            Sair da conta
          </button>
        </div>
      </div>
    </>
  )
}