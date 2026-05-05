"use client"

import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, onSnapshot } from "firebase/firestore"

export default function Circulo() {
  const [contatos, setContatos] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "circulos"), (snapshot) => {
      setContatos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        backgroundColor: "white", padding: "16px 24px",
        borderBottom: "1px solid #eee", display: "flex",
        alignItems: "center", gap: "12px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
      }}>
        <span style={{ fontSize: "22px" }}>📍</span>
        <h1 style={{ fontSize: "18px", margin: 0, fontWeight: "bold" }}>Ártemis</h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: "#1a1a2e" }}>Meu Círculo</h2>
        <p style={{ color: "#999", marginBottom: "24px", fontSize: "14px" }}>
          Acompanhe as rotas frequentes das pessoas próximas
        </p>

        {contatos.length === 0 && (
          <div style={{
            backgroundColor: "white", borderRadius: "16px",
            padding: "32px", textAlign: "center",
            color: "#aaa", fontSize: "14px"
          }}>
            <p style={{ fontSize: "32px" }}>👥</p>
            <p>Nenhum contato no círculo ainda.</p>
            <p>Adicione pessoas para acompanhar a localização delas.</p>
          </div>
        )}

        {contatos.map((contato) => (
          <div key={contato.id} style={{
            backgroundColor: "white", borderRadius: "16px",
            padding: "16px", marginBottom: "12px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "50%",
                backgroundColor: "#6B4C9A", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "bold", fontSize: "16px"
              }}>
                {contato.nome?.charAt(0) || "?"}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: "#1a1a2e" }}>
                  {contato.nome || "Contato"}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>
                  {contato.rotas || 0} rotas frequentes
                </p>
              </div>
            </div>
            <span style={{ color: "#aaa", fontSize: "20px" }}>›</span>
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
          backgroundColor: "#1a1a2e", color: "white",
          border: "none", borderRadius: "16px",
          fontSize: "15px", fontWeight: "bold",
          cursor: "pointer"
        }}>
          + Adicionar ao Círculo
        </button>
      </div>

      {/* Navegação inferior */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "white", borderTop: "1px solid #eee",
        display: "flex", justifyContent: "space-around",
        padding: "12px 0", boxShadow: "0 -2px 10px rgba(0,0,0,0.06)"
      }}>
        {[
          { icon: "📍", label: "Mapa", href: "/mapa" },
          { icon: "👥", label: "Círculo", href: "/circulo" },
          { icon: "💬", label: "Comunidade", href: "/comunidade" }
        ].map((item) => (
          <a key={item.label} href={item.href} style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "4px",
            textDecoration: "none", color: "#6B4C9A",
            fontSize: "12px", fontWeight: "500"
          }}>
            <span style={{ fontSize: "20px" }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  )
}