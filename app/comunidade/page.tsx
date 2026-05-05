"use client"

import { useState, useEffect } from "react"
import { db } from "../firebase"
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore"

export default function Comunidade() {
  const [posts, setPosts] = useState([])
  const [texto, setTexto] = useState("")
  const [anonimo, setAnonimo] = useState(false)

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
      texto,
      anonimo,
      nome: anonimo ? "Anônimo" : "Maria Silva",
      criado_em: serverTimestamp()
    })
    setTexto("")
  }

  function formatarData(timestamp) {
    if (!timestamp?.seconds) return "agora"
    return new Date(timestamp.seconds * 1000).toLocaleString("pt-BR")
  }

  return (
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", fontFamily: "sans-serif" }}>

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

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 160px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: "#1a1a2e" }}>Comunidade</h2>
        <p style={{ color: "#999", marginBottom: "24px", fontSize: "14px" }}>
          Compartilhe experiências e dicas de segurança
        </p>

        {posts
          .filter(post => post.criado_em)
          .map((post) => (
          <div key={post.id} style={{
            backgroundColor: "white", borderRadius: "16px",
            padding: "16px", marginBottom: "12px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.07)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                backgroundColor: post.anonimo ? "#888" : "#6B4C9A",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "18px",
                flexShrink: 0
              }}>
                {post.anonimo ? "🔒" : "👤"}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#1a1a2e" }}>
                  {post.nome}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>
                  {formatarData(post.criado_em)}
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: "1.6", color: "#333" }}>
              {post.texto}
            </p>
          </div>
        ))}
      </div>

      {/* Barra de publicação fixa */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "white", padding: "16px 24px",
        borderTop: "1px solid #eee",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.08)"
      }}>
        <textarea
          placeholder="Compartilhe uma experiência ou dica de segurança..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={{
            width: "100%", padding: "12px 16px",
            borderRadius: "12px", border: "1px solid #e0e0e0",
            marginBottom: "10px", resize: "none",
            fontFamily: "sans-serif", fontSize: "14px",
            boxSizing: "border-box", outline: "none",
            color: "#333"
          }}
          rows={2}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{
            fontSize: "13px", color: "#666",
            display: "flex", alignItems: "center", gap: "6px", cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={anonimo}
              onChange={(e) => setAnonimo(e.target.checked)}
            />
            Publicar anonimamente
          </label>
          <button
            onClick={publicar}
            style={{
              backgroundColor: "#1a1a2e", color: "white",
              padding: "10px 24px", borderRadius: "12px",
              border: "none", cursor: "pointer",
              fontWeight: "bold", fontSize: "14px"
            }}>
            + Nova Publicação
          </button>
        </div>
      </div>
    </div>
  )
}