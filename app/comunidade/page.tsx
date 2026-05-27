"use client"

import { useState, useEffect, useRef } from "react"
import { db, auth } from "../firebase"
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc, increment,
  arrayUnion, arrayRemove, getDoc, where
} from "firebase/firestore"
import {
  MapPin, Users, MessageSquare, Home, Bell,
  Lock, User, Heart, ThumbsUp, Flag, X,
  Send, Paperclip, Image, Star, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import Header from "../componentes/Header"

const cores = {
  fundo: "#EEEAF8",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  lavanda: "#8575BD",
  amarelo: "#FDEA72",
  branco: "#FFFFFF",
}

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

const TIPOS = [
  { valor: "relato", label: "Relato", cor: "#5A4997", fundo: "rgba(90,73,151,0.1)" },
  { valor: "alerta", label: "Alerta", cor: "#dc2626", fundo: "rgba(220,38,38,0.1)" },
  { valor: "ajuda", label: "Pedido de Ajuda", cor: "#d97706", fundo: "rgba(217,119,6,0.1)" },
]

const PALAVRAS_PROIBIDAS = ["idiota", "imbecil", "burra", "estúpida", "lixo"]

function filtrarTexto(texto: string) {
  let resultado = texto
  PALAVRAS_PROIBIDAS.forEach(p => {
    resultado = resultado.replace(new RegExp(p, "gi"), "***")
  })
  return resultado
}

function formatarData(timestamp: any) {
  if (!timestamp?.seconds) return "agora"
  const diff = Math.floor((Date.now() - timestamp.seconds * 1000) / 60000)
  if (diff < 1) return "agora"
  if (diff < 60) return `${diff}min atrás`
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
  return `${Math.floor(diff / 1440)}d atrás`
}

function formatarHora(timestamp: any) {
  if (!timestamp?.seconds) return ""
  return new Date(timestamp.seconds * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// ─── ABA CHAT ───
function AbaChat({ usuario, nomeUsuario }: any) {
  const [grupos, setGrupos] = useState<any[]>([])
  const [grupoSelecionado, setGrupoSelecionado] = useState<any>(null)
  const [mensagens, setMensagens] = useState<any[]>([])
  const [texto, setTexto] = useState("")
  const [nomesMembros, setNomesMembros] = useState<any>({})
  const bottomRef = useRef<any>(null)

  useEffect(() => {
    if (!usuario) return
    const q = query(collection(db, "grupos"), where("membros", "array-contains", usuario.uid))
    const unsub = onSnapshot(q, (snap) => {
      setGrupos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [usuario])

  useEffect(() => {
    if (!grupoSelecionado) return
    const q = query(
      collection(db, "grupos", grupoSelecionado.id, "mensagens"),
      orderBy("criado_em", "asc")
    )
    const unsub = onSnapshot(q, async (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMensagens(msgs)

      // Busca nomes dos remetentes
      const ids = [...new Set(msgs.map((m: any) => m.usuario_id).filter(Boolean))]
      const novosNomes: any = { ...nomesMembros }
      await Promise.all(ids.map(async (id: any) => {
        if (!novosNomes[id]) {
          try {
            const perfil = await getDoc(doc(db, "usuarios", id))
            novosNomes[id] = perfil.data()?.nome?.split(" ")[0] || "Usuária"
          } catch { novosNomes[id] = "Usuária" }
        }
      }))
      setNomesMembros(novosNomes)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    })
    return () => unsub()
  }, [grupoSelecionado])

  async function enviarMensagem() {
    if (!texto.trim() || !grupoSelecionado) return
    await addDoc(collection(db, "grupos", grupoSelecionado.id, "mensagens"), {
      texto: filtrarTexto(texto),
      usuario_id: usuario.uid,
      nome: nomeUsuario,
      criado_em: serverTimestamp()
    })
    setTexto("")
  }

  if (!grupoSelecionado) return (
    <div style={{ padding: "16px" }}>
      <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Seus círculos
      </p>
      {grupos.length === 0 ? (
        <div style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 1px 6px rgba(90,73,151,0.07)" }}>
          <Users size={36} color={cores.roxoClaro} style={{ marginBottom: "10px" }} />
          <p style={{ color: cores.lavanda, fontSize: "14px", margin: 0 }}>Nenhum grupo ainda.</p>
          <p style={{ color: "#bbb", fontSize: "12px", marginTop: "6px" }}>Crie grupos na aba Círculo.</p>
        </div>
      ) : grupos.map(grupo => (
        <div key={grupo.id} onClick={() => setGrupoSelecionado(grupo)} style={{
          backgroundColor: cores.branco, borderRadius: "14px", padding: "14px 16px",
          marginBottom: "10px", display: "flex", alignItems: "center", gap: "12px",
          cursor: "pointer", boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
        }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", backgroundColor: grupo.cor || cores.roxo, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: cores.roxoEscuro }}>{grupo.nome}</p>
            <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{grupo.membros?.length || 0} membros</p>
          </div>
          <ChevronRight size={18} color={cores.lavanda} />
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)" }}>
      {/* Header do chat */}
      <div style={{ padding: "12px 16px", backgroundColor: cores.branco, borderBottom: `1px solid ${cores.fundo}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={() => setGrupoSelecionado(null)} style={{ background: "none", border: "none", cursor: "pointer", color: cores.roxo, fontSize: "20px" }}>←</button>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: grupoSelecionado.cor || cores.roxo, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Users size={18} color="white" />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: cores.roxoEscuro }}>{grupoSelecionado.nome}</p>
          <p style={{ margin: 0, fontSize: "11px", color: cores.lavanda }}>{grupoSelecionado.membros?.length || 0} membros</p>
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {mensagens.length === 0 && (
          <p style={{ textAlign: "center", color: cores.lavanda, fontSize: "13px", marginTop: "32px" }}>
            Nenhuma mensagem ainda. Diga olá! 👋
          </p>
        )}
        {mensagens.map((msg: any) => {
          const minha = msg.usuario_id === usuario?.uid
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: minha ? "flex-end" : "flex-start" }}>
              {!minha && (
                <p style={{ margin: "0 0 2px 8px", fontSize: "11px", color: cores.lavanda, fontWeight: "600" }}>
                  {nomesMembros[msg.usuario_id] || msg.nome || "Usuária"}
                </p>
              )}
              <div style={{
                maxWidth: "75%", padding: "10px 14px", borderRadius: minha ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                backgroundColor: minha ? cores.roxo : cores.branco,
                boxShadow: "0 1px 4px rgba(90,73,151,0.1)"
              }}>
                <p style={{ margin: 0, fontSize: "14px", color: minha ? "white" : cores.roxoEscuro, lineHeight: "1.4" }}>
                  {msg.texto}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "10px", color: minha ? "rgba(255,255,255,0.7)" : "#bbb", textAlign: "right" }}>
                  {formatarHora(msg.criado_em)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", backgroundColor: cores.branco, borderTop: `1px solid ${cores.fundo}`, display: "flex", alignItems: "center", gap: "8px" }}>
        <button style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Paperclip size={20} color={cores.lavanda} />
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Image size={20} color={cores.lavanda} />
        </button>
        <input
          placeholder="Digite uma mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "20px",
            border: `1.5px solid #E8E0F5`, outline: "none",
            fontSize: "14px", color: "#333", backgroundColor: cores.fundo
          }}
        />
        <button onClick={enviarMensagem} style={{
          width: "40px", height: "40px", borderRadius: "50%",
          backgroundColor: cores.roxo, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Send size={18} color="white" />
        </button>
      </div>
    </div>
  )
}

// ─── ABA COMUNIDADE ───
function AbaComunidade({ usuario, nomeUsuario }: any) {
  const [posts, setPosts] = useState<any[]>([])
  const [texto, setTexto] = useState("")
  const [tipo, setTipo] = useState("relato")
  const [anonimo, setAnonimo] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [localizacao, setLocalizacao] = useState("")
  const [carregandoGPS, setCarregandoGPS] = useState(false)
  const [postComentando, setPostComentando] = useState<any>(null)
  const [textoComentario, setTextoComentario] = useState("")
  const [comentarios, setComentarios] = useState<any>({})
  const [ordenacao, setOrdenacao] = useState("recentes")
  const [filtroTipo, setFiltroTipo] = useState("todos")

useEffect(() => {
  const q = query(collection(db, "posts"), orderBy("criado_em", "desc"))
  const unsub = onSnapshot(q, (snap) => {
    const dados = snap.docs.map(d => {
      const data = d.data() as any
      return { id: d.id, ...data }
    }).filter((p: any) => p.criado_em && (p.denuncias || 0) < 5)
    setPosts(dados)
  })
  return () => unsub()
}, [])

  async function obterGPS() {
    setCarregandoGPS(true)
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
        const data = await res.json()
        const end = data.address
        setLocalizacao(end.suburb || end.neighbourhood || end.city || "Local atual")
      } catch { setLocalizacao("Local atual") }
      setCarregandoGPS(false)
    }, () => setCarregandoGPS(false))
  }

  async function publicar() {
    if (!texto.trim()) return
    await addDoc(collection(db, "posts"), {
      texto: filtrarTexto(texto), tipo, anonimo,
      localizacao: localizacao || null,
      nome: anonimo ? "Anônimo" : nomeUsuario,
      usuario_id: anonimo ? null : usuario?.uid,
      curtidas: 0, curtidas_por: [],
      confirmacoes: 0, confirmacoes_por: [],
      denuncias: 0, comentarios: 0,
      criado_em: serverTimestamp()
    })
    setTexto(""); setTipo("relato"); setLocalizacao(""); setAnonimo(false); setModalAberto(false)
  }

  async function curtir(postId: string, jaGostou: boolean) {
    if (!usuario) return
    const ref = doc(db, "posts", postId)
    if (jaGostou) {
      await updateDoc(ref, { curtidas: increment(-1), curtidas_por: arrayRemove(usuario.uid) })
    } else {
      await updateDoc(ref, { curtidas: increment(1), curtidas_por: arrayUnion(usuario.uid) })
    }
  }

  async function confirmar(postId: string, jaConfirmou: boolean) {
    if (!usuario) return
    const ref = doc(db, "posts", postId)
    if (jaConfirmou) {
      await updateDoc(ref, { confirmacoes: increment(-1), confirmacoes_por: arrayRemove(usuario.uid) })
    } else {
      await updateDoc(ref, { confirmacoes: increment(1), confirmacoes_por: arrayUnion(usuario.uid) })
    }
  }

  async function denunciar(postId: string) {
    await updateDoc(doc(db, "posts", postId), { denuncias: increment(1) })
    alert("Post denunciado.")
  }

  async function carregarComentarios(postId: string) {
    if (postComentando === postId) { setPostComentando(null); return }
    setPostComentando(postId)
    const q = query(collection(db, "posts", postId, "comentarios"), orderBy("criado_em", "asc"))
    onSnapshot(q, (snap) => {
      setComentarios((prev: any) => ({ ...prev, [postId]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }))
    })
  }

  async function enviarComentario(postId: string) {
    if (!textoComentario.trim()) return
    await addDoc(collection(db, "posts", postId, "comentarios"), {
      texto: filtrarTexto(textoComentario),
      nome: nomeUsuario, usuario_id: usuario?.uid,
      criado_em: serverTimestamp()
    })
    await updateDoc(doc(db, "posts", postId), { comentarios: increment(1) })
    setTextoComentario("")
  }

  const postsFiltrados = posts
    .filter(p => filtroTipo === "todos" || p.tipo === filtroTipo)
    .sort((a, b) => ordenacao === "relevantes"
      ? ((b.confirmacoes || 0) + (b.curtidas || 0)) - ((a.confirmacoes || 0) + (a.curtidas || 0))
      : 0
    )

  const tipoInfo = (t: string) => TIPOS.find(x => x.valor === t) || TIPOS[0]

  return (
    <div style={{ padding: "16px" }}>
      {/* Filtros */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["recentes", "relevantes"].map(ord => (
          <button key={ord} onClick={() => setOrdenacao(ord)} style={{
            padding: "6px 12px", borderRadius: "20px", fontSize: "12px",
            border: `1.5px solid ${ordenacao === ord ? cores.roxo : "rgba(90,73,151,0.2)"}`,
            backgroundColor: ordenacao === ord ? cores.roxo : cores.branco,
            color: ordenacao === ord ? cores.branco : cores.lavanda,
            cursor: "pointer", fontWeight: ordenacao === ord ? "600" : "400"
          }}>
            {ord === "recentes" ? "Mais recentes" : "Mais relevantes"}
          </button>
        ))}
        {[{ valor: "todos", label: "Todos" }, ...TIPOS].map(t => (
          <button key={t.valor} onClick={() => setFiltroTipo(t.valor)} style={{
            padding: "6px 12px", borderRadius: "20px", fontSize: "12px",
            border: `1.5px solid ${filtroTipo === t.valor ? ((t as any).cor || cores.roxo) : "rgba(90,73,151,0.2)"}`,
            backgroundColor: filtroTipo === t.valor ? ((t as any).fundo || "rgba(90,73,151,0.1)") : cores.branco,
            color: filtroTipo === t.valor ? ((t as any).cor || cores.roxo) : cores.lavanda,
            cursor: "pointer"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {postsFiltrados.map((post) => {
        const info = tipoInfo(post.tipo)
        const jaGostou = usuario && (post.curtidas_por || []).includes(usuario.uid)
        const jaConfirmou = usuario && (post.confirmacoes_por || []).includes(usuario.uid)
        return (
          <div key={post.id} style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "16px", marginBottom: "12px",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)",
            borderLeft: `4px solid ${info.cor}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: post.anonimo ? "#e5e7eb" : cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {post.anonimo ? <Lock size={16} color={cores.lavanda} /> : <User size={16} color={cores.roxo} />}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: cores.roxoEscuro }}>{post.nome}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {post.localizacao && <><MapPin size={11} color={cores.lavanda} /><p style={{ margin: 0, fontSize: "11px", color: cores.lavanda }}>{post.localizacao}</p><span style={{ color: "#ddd" }}>•</span></>}
                    <p style={{ margin: 0, fontSize: "11px", color: "#bbb" }}>{formatarData(post.criado_em)}</p>
                  </div>
                </div>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: info.fundo, color: info.cor, alignSelf: "flex-start" }}>
                {info.label}
              </span>
            </div>

            <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: "1.6", color: "#333" }}>{post.texto}</p>

            <div style={{ display: "flex", gap: "12px", paddingTop: "10px", borderTop: `1px solid ${cores.fundo}`, alignItems: "center" }}>
              <button onClick={() => curtir(post.id, jaGostou)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: jaGostou ? "#e11d48" : cores.lavanda, fontSize: "12px", padding: 0 }}>
                <Heart size={14} fill={jaGostou ? "#e11d48" : "none"} /> {post.curtidas || 0}
              </button>
              <button onClick={() => confirmar(post.id, jaConfirmou)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: jaConfirmou ? "#16a34a" : cores.lavanda, fontSize: "12px", padding: 0 }}>
                <ThumbsUp size={14} fill={jaConfirmou ? "#16a34a" : "none"} /> {post.confirmacoes || 0}
              </button>
              <button onClick={() => carregarComentarios(post.id)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: postComentando === post.id ? cores.roxo : cores.lavanda, fontSize: "12px", padding: 0 }}>
                <MessageSquare size={14} /> {post.comentarios || 0}
              </button>
              <button onClick={() => denunciar(post.id)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "12px", padding: 0, marginLeft: "auto" }}>
                <Flag size={14} />
              </button>
            </div>

            {postComentando === post.id && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${cores.fundo}` }}>
                {(comentarios[post.id] || []).map((c: any) => (
                  <div key={c.id} style={{ backgroundColor: cores.fundo, borderRadius: "10px", padding: "8px 12px", marginBottom: "8px" }}>
                    <p style={{ margin: "0 0 2px", fontWeight: "600", fontSize: "12px", color: cores.roxoEscuro }}>{c.nome}</p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#444" }}>{c.texto}</p>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input placeholder="Comentar..." value={textoComentario} onChange={(e) => setTextoComentario(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarComentario(post.id)} style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: `1.5px solid #E8E0F5`, outline: "none", fontSize: "13px" }} />
                  <button onClick={() => enviarComentario(post.id)} style={{ padding: "8px 14px", backgroundColor: cores.roxo, color: cores.branco, border: "none", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>Enviar</button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {postsFiltrados.length === 0 && (
        <div style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 1px 6px rgba(90,73,151,0.07)" }}>
          <MessageSquare size={40} color={cores.roxoClaro} style={{ marginBottom: "12px" }} />
          <p style={{ color: cores.lavanda, margin: 0 }}>Nenhum post encontrado.</p>
        </div>
      )}

      {/* Modal nova publicação */}
      {modalAberto && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ backgroundColor: cores.branco, width: "100%", borderRadius: "24px 24px 0 0", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "17px" }}>Nova Publicação</h3>
              <button onClick={() => setModalAberto(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={cores.lavanda} /></button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {TIPOS.map(t => (
                <button key={t.valor} onClick={() => setTipo(t.valor)} style={{ flex: 1, padding: "10px 8px", borderRadius: "12px", fontSize: "12px", border: `2px solid ${tipo === t.valor ? t.cor : "rgba(90,73,151,0.15)"}`, backgroundColor: tipo === t.valor ? t.fundo : cores.branco, color: tipo === t.valor ? t.cor : cores.lavanda, cursor: "pointer", fontWeight: tipo === t.valor ? "700" : "400" }}>
                  {t.label}
                </button>
              ))}
            </div>
            <textarea placeholder="Descreva o ocorrido..." value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: `1.5px solid #E8E0F5`, marginBottom: "12px", resize: "none", fontFamily: "sans-serif", fontSize: "14px", boxSizing: "border-box", outline: "none", color: "#333" }} rows={4} />
            <button onClick={obterGPS} style={{ padding: "8px 14px", borderRadius: "10px", fontSize: "12px", border: `1.5px solid rgba(90,73,151,0.2)`, backgroundColor: cores.branco, color: cores.lavanda, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <MapPin size={14} />{carregandoGPS ? "Obtendo..." : localizacao || "Usar localização atual (bairro)"}
            </button>
            <input placeholder="Ou escreva o bairro/local" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: `1.5px solid #E8E0F5`, marginBottom: "14px", fontSize: "13px", boxSizing: "border-box", outline: "none", color: "#333" }} />
            <label style={{ fontSize: "13px", color: cores.lavanda, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "16px" }}>
              <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
              Publicar anonimamente
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setModalAberto(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${cores.roxoClaro}`, backgroundColor: "transparent", color: cores.roxo, cursor: "pointer", fontSize: "14px" }}>Cancelar</button>
              <button onClick={publicar} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: cores.roxo, color: cores.branco, cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>Publicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Botão nova publicação */}
      <div style={{ position: "fixed", bottom: "70px", left: 0, right: 0, padding: "0 16px", display: "flex", gap: "10px" }}>
        <button onClick={() => window.location.href = "/inicio"} style={{ width: "52px", height: "52px", borderRadius: "14px", backgroundColor: "#ef4444", color: "white", border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(239,68,68,0.4)", fontWeight: "800", fontSize: "13px" }}>
          SOS
        </button>
        <button onClick={() => setModalAberto(true)} style={{ flex: 1, padding: "16px", backgroundColor: cores.roxo, color: cores.branco, border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 16px rgba(90,73,151,0.3)" }}>
          + Nova Publicação
        </button>
      </div>
    </div>
  )
}

// ─── ABA PARCEIROS ───
function AbaParceiros() {
  return (
    <div style={{ padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
      <div style={{
        width: "80px", height: "80px", borderRadius: "50%",
        backgroundColor: `rgba(90,73,151,0.1)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "16px"
      }}>
        <Star size={36} color={cores.roxo} />
      </div>
      <h3 style={{ color: cores.roxoEscuro, fontSize: "18px", fontWeight: "700", margin: "0 0 8px" }}>
        Em breve
      </h3>
      <p style={{ color: cores.lavanda, fontSize: "14px", textAlign: "center", maxWidth: "260px", lineHeight: "1.6", margin: 0 }}>
        Estamos fechando parcerias com empresas de segurança e bem-estar para oferecer descontos exclusivos para você.
      </p>
    </div>
  )
}

// ─── PÁGINA PRINCIPAL ───
export default function Comunidade() {
  const pathname = usePathname()
  const [usuario, setUsuario] = useState<any>(null)
  const [nomeUsuario, setNomeUsuario] = useState("Usuária")
  const [aba, setAba] = useState("comunidade")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user)
        try {
          const snap = await getDoc(doc(db, "usuarios", user.uid))
          if (snap.exists()) setNomeUsuario(snap.data().nome?.split(" ")[0] || "Usuária")
        } catch {}
      }
    })
    return () => unsub()
  }, [])

  const abas = [
    { id: "chat", label: "Chat do Círculo" },
    { id: "comunidade", label: "Comunidade" },
    { id: "parceiros", label: "Parceiros" },
  ]

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />

      {/* Tabs */}
      <div style={{ backgroundColor: cores.branco, borderBottom: `1px solid ${cores.fundo}`, padding: "0 16px", display: "flex", gap: "0", overflowX: "auto" }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            padding: "14px 16px", border: "none", borderBottom: `3px solid ${aba === a.id ? cores.roxo : "transparent"}`,
            backgroundColor: "transparent", color: aba === a.id ? cores.roxo : cores.lavanda,
            fontSize: "13px", fontWeight: aba === a.id ? "700" : "400",
            cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s"
          }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: "640px", margin: "0 auto", paddingBottom: "80px" }}>
        {aba === "chat" && <AbaChat usuario={usuario} nomeUsuario={nomeUsuario} />}
        {aba === "comunidade" && <AbaComunidade usuario={usuario} nomeUsuario={nomeUsuario} />}
        {aba === "parceiros" && <AbaParceiros />}
      </div>

      {/* Navegação inferior */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: cores.branco, borderTop: `1px solid ${cores.fundo}`, display: "flex", justifyContent: "space-around", padding: "10px 0", boxShadow: "0 -2px 12px rgba(90,73,151,0.08)" }}>
        {nav.map((item) => {
          const ativo = pathname === item.href
          return (
            <Link key={item.label} href={item.href} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", color: ativo ? cores.roxo : "#aaa" }}>
              <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent" }}>
                <item.icon size={20} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}