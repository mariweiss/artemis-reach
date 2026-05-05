"use client"

import { useState } from "react"
import { auth } from "./firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"

export default function Home() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mensagem, setMensagem] = useState("")

  async function cadastrar() {
    try {
      await createUserWithEmailAndPassword(auth, email, senha)
      setMensagem("✅ Cadastro realizado com sucesso!")
    } catch (erro) {
      setMensagem("❌ Erro: " + erro.message)
    }
  }

  async function entrar() {
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      setMensagem("✅ Login realizado com sucesso!")
    } catch (erro) {
      setMensagem("❌ Erro: " + erro.message)
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#6B4C9A",
      gap: "16px"
    }}>
      <h1 style={{ color: "white", fontSize: "32px" }}>ÁRTEMIS REACH</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: "12px", borderRadius: "8px", width: "300px" }}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        style={{ padding: "12px", borderRadius: "8px", width: "300px" }}
      />

      <button
        onClick={entrar}
        style={{
          backgroundColor: "white",
          color: "#6B4C9A",
          padding: "12px 32px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
          width: "300px"
        }}>
        Entrar
      </button>

      <button
        onClick={cadastrar}
        style={{
          backgroundColor: "transparent",
          color: "white",
          padding: "12px 32px",
          borderRadius: "8px",
          border: "2px solid white",
          cursor: "pointer",
          width: "300px"
        }}>
        Cadastrar
      </button>

      {mensagem && (
        <p style={{ color: "white", marginTop: "16px" }}>{mensagem}</p>
      )}
    </div>
  )
}