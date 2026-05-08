"use client"

import { useState, useEffect } from "react"
import { auth, db } from "./firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

const cores = {
  fundo: "#EEEAF8",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  branco: "#FFFFFF",
}

// ─── TELA DE SPLASH ───
function Splash({ onFim }) {
  const [fase, setFase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setFase(1), 300)
    const t2 = setTimeout(() => setFase(2), 1200)
    const t3 = setTimeout(() => setFase(3), 2000)
    const t4 = setTimeout(() => onFim(), 2800)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${cores.roxoEscuro} 0%, ${cores.roxo} 60%, ${cores.roxoClaro} 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", overflow: "hidden", position: "relative"
    }}>
      {/* Círculos de fundo */}
      <div style={{
        position: "absolute", width: "400px", height: "400px",
        borderRadius: "50%", border: `1px solid rgba(255,255,255,0.08)`,
        top: "50%", left: "50%", transform: "translate(-50%, -50%)"
      }} />
      <div style={{
        position: "absolute", width: "600px", height: "600px",
        borderRadius: "50%", border: `1px solid rgba(255,255,255,0.05)`,
        top: "50%", left: "50%", transform: "translate(-50%, -50%)"
      }} />

      {/* Logo animado */}
      <div style={{
        opacity: fase >= 1 ? 1 : 0,
        transform: fase >= 1 ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-180deg)",
        transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
        marginBottom: "32px", position: "relative"
      }}>
        {/* Lua crescente */}
        <svg width="120" height="120" viewBox="0 0 120 120">
          <defs>
            <radialGradient id="luaGrad" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#E0D0FF" />
              <stop offset="100%" stopColor="#8575BD" />
            </radialGradient>
          </defs>
          {/* Lua principal */}
          <circle cx="60" cy="60" r="48" fill="url(#luaGrad)" opacity="0.95" />
          {/* Recorte da lua crescente */}
          <circle cx="78" cy="48" r="40" fill={cores.roxo} />
          {/* Estrelinhas */}
          <circle cx="88" cy="28" r="3" fill="white" opacity="0.9" />
          <circle cx="96" cy="42" r="2" fill="white" opacity="0.7" />
          <circle cx="82" cy="18" r="1.5" fill="white" opacity="0.8" />
          {/* Sinal wifi/ondas */}
          <g transform="translate(32, 52)" opacity="0.85">
            <path d="M8 20 Q14 14 20 20" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M4 16 Q14 6 24 16" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M0 12 Q14 -2 28 12" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="14" cy="23" r="2.5" fill="white" />
          </g>
        </svg>
      </div>

      {/* Nome */}
      <div style={{
        opacity: fase >= 2 ? 1 : 0,
        transform: fase >= 2 ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.6s ease",
        textAlign: "center"
      }}>
        <h1 style={{
          color: cores.branco, fontSize: "36px",
          fontWeight: "800", margin: 0, letterSpacing: "6px",
          textTransform: "uppercase"
        }}>
          ARTEMIS
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.7)", fontSize: "13px",
          letterSpacing: "4px", marginTop: "6px",
          textTransform: "uppercase"
        }}>
          REACH
        </p>
      </div>

      {/* Loading dots */}
      <div style={{
        opacity: fase >= 3 ? 1 : 0,
        transition: "opacity 0.4s ease",
        display: "flex", gap: "8px", marginTop: "48px"
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.6)",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  const [splash, setSplash] = useState(true)
  const [tela, setTela] = useState("login")
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [telefone, setTelefone] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()

  async function entrar() {
    setErro("")
    setCarregando(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      setTela("modo")
    } catch (e) {
      setErro("Email ou senha incorretos.")
    }
    setCarregando(false)
  }

  async function cadastrar() {
    setErro("")
    if (!nome || !email || !senha || !telefone) {
      setErro("Preencha todos os campos.")
      return
    }
    setCarregando(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha)
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome, email, telefone,
        criado_em: new Date().toISOString()
      })
      setTela("modo")
    } catch (e) {
      setErro("Erro ao cadastrar. Verifique os dados.")
    }
    setCarregando(false)
  }

  function escolherModo(modo) {
    router.push("/inicio")
  }

  if (splash) return <Splash onFim={() => setSplash(false)} />

  // ─── TELA DE SELEÇÃO DE MODO ───
  if (tela === "modo") return (
    <div style={{
      minHeight: "100vh", backgroundColor: cores.fundo,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px", fontFamily: "sans-serif"
    }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%",
        backgroundColor: cores.roxo, display: "flex",
        alignItems: "center", justifyContent: "center",
        marginBottom: "16px"
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12 12-5.4 12-12S22.6 4 16 4z" fill="white" opacity="0.9"/>
          <path d="M20 8C17 8 14 10 14 13c0 2 1 4 3 5-1 0-2 1-2 2h6c0-1-1-2-2-2 2-1 3-3 3-5 0-3-1-5-2-5z" fill={cores.roxo}/>
        </svg>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: cores.roxoEscuro, margin: 0 }}>
        Artemis
      </h1>
      <p style={{ color: cores.roxo, marginBottom: "40px", fontSize: "15px" }}>
        Sua segurança pessoal em tempo real
      </p>

      <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "700px", flexWrap: "wrap" }}>
        {[
          { modo: "echo", titulo: "Artemis Echo", desc: "Conecte-se com seu dispositivo de segurança pessoal para proteção completa e monitoramento avançado", icone: "🛡️" },
          { modo: "reach", titulo: "Artemis Reach", desc: "Use apenas o aplicativo para compartilhar sua localização em tempo real com seu círculo de confiança", icone: "📱" }
        ].map(item => (
          <div key={item.modo} onClick={() => escolherModo(item.modo)} style={{
            flex: "1 1 280px", backgroundColor: cores.branco, borderRadius: "20px",
            padding: "32px 24px", textAlign: "center", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(90,73,151,0.1)",
            transition: "transform 0.15s, box-shadow 0.15s"
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)"
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(90,73,151,0.2)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(90,73,151,0.1)"
            }}
          >
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              backgroundColor: cores.fundo, display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "24px"
            }}>
              {item.icone}
            </div>
            <h3 style={{ color: cores.roxoEscuro, margin: "0 0 12px", fontSize: "17px" }}>
              {item.titulo}
            </h3>
            <p style={{ color: "#888", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <p style={{ color: "#aaa", fontSize: "12px", marginTop: "32px", textAlign: "center" }}>
        Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
      </p>
    </div>
  )

  // ─── TELA DE LOGIN / CADASTRO ───
  return (
    <div style={{
      minHeight: "100vh", backgroundColor: cores.fundo,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px", fontFamily: "sans-serif"
    }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%",
        backgroundColor: cores.roxo, display: "flex",
        alignItems: "center", justifyContent: "center", marginBottom: "16px"
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="14" fill="white" opacity="0.9" />
          <circle cx="23" cy="13" r="11" fill={cores.roxo} />
          <circle cx="26" cy="8" r="2" fill="white" opacity="0.9" />
          <circle cx="30" cy="14" r="1.5" fill="white" opacity="0.7" />
        </svg>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "bold", color: cores.roxoEscuro, margin: 0 }}>
        Artemis
      </h1>
      <p style={{ color: cores.roxo, marginBottom: "32px", fontSize: "15px" }}>
        {tela === "login" ? "Bem-vinda de volta" : "Crie sua conta"}
      </p>

      <div style={{
        backgroundColor: cores.branco, borderRadius: "20px",
        padding: "32px", width: "100%", maxWidth: "440px",
        boxShadow: "0 4px 24px rgba(90,73,151,0.12)"
      }}>
        {tela === "cadastro" && (
          <Campo label="Nome completo" placeholder="Seu nome completo" value={nome} onChange={setNome} tipo="text" />
        )}
        <Campo label="Email" placeholder="seu@email.com" value={email} onChange={setEmail} tipo="email" />
        <Campo label="Senha" placeholder="••••••••" value={senha} onChange={setSenha} tipo={mostrarSenha ? "text" : "password"}
          extra={
            <span onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{ cursor: "pointer", color: cores.roxo, fontSize: "13px" }}>
              {mostrarSenha ? "Ocultar" : "Ver"}
            </span>
          }
        />
        {tela === "cadastro" && (
          <Campo label="Telefone" placeholder="(00) 00000-0000" value={telefone} onChange={setTelefone} tipo="tel" />
        )}

        {tela === "login" && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
            <label style={{ fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
              <input type="checkbox" /> Lembrar-me
            </label>
            <span style={{ fontSize: "13px", color: cores.roxo, cursor: "pointer", fontWeight: "600" }}>
              Esqueceu a senha?
            </span>
          </div>
        )}

        {erro && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>{erro}</p>}

        <button onClick={tela === "login" ? entrar : cadastrar} disabled={carregando} style={{
          width: "100%", padding: "14px", backgroundColor: cores.roxo,
          color: cores.branco, border: "none", borderRadius: "12px",
          fontSize: "15px", fontWeight: "bold", cursor: "pointer",
          opacity: carregando ? 0.7 : 1, marginBottom: "16px"
        }}>
          {carregando ? "Aguarde..." : tela === "login" ? "Entrar" : "Cadastrar"}
        </button>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#888", margin: 0 }}>
          {tela === "login" ? "Não tem uma conta? " : "Já tem uma conta? "}
          <span onClick={() => { setTela(tela === "login" ? "cadastro" : "login"); setErro("") }}
            style={{ color: cores.roxo, fontWeight: "bold", cursor: "pointer" }}>
            {tela === "login" ? "Cadastre-se" : "Entrar"}
          </span>
        </p>
      </div>

      <p style={{ color: "#aaa", fontSize: "12px", marginTop: "24px", textAlign: "center" }}>
        Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
      </p>
    </div>
  )
}

function Campo({ label, placeholder, value, onChange, tipo, extra }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ fontSize: "13px", fontWeight: "600", color: "#2F195F", display: "block", marginBottom: "8px" }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        border: "1.5px solid #E8E0F5", borderRadius: "12px", padding: "12px 16px"
      }}>
        <input type={tipo} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ border: "none", outline: "none", flex: 1, fontSize: "14px", color: "#333", background: "transparent" }}
        />
        {extra}
      </div>
    </div>
  )
}