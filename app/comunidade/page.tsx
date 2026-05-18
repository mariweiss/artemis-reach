"use client"

import { useState, useEffect } from "react"
import { db, auth } from "../firebase"
import {
  collection, addDoc, onSnapshot, orderBy, query,
  serverTimestamp, doc, updateDoc, increment,
  arrayUnion, arrayRemove, getDoc, where, getDocs
} from "firebase/firestore"
import {
  MapPin, Users, MessageSquare, Home, Bell,
  Lock, User, Heart, ThumbsUp, Flag, X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import type { User as FirebaseUser } from "firebase/auth"
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

export default function Comunidade() {
  const [posts, setPosts] = useState<any[]>([])
  const [usuario, setUsuario] = useState<FirebaseUser | null>(null)
  const [nomeUsuario, setNomeUsuario] = useState("Usuária")
  const [texto, setTexto] = useState("")
  const [tipo, setTipo] = useState("relato")
  const [anonimo, setAnonimo] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [ordenacao, setOrdenacao] = useState("recentes")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [localizacao, setLocalizacao] = useState("")
  const [carregandoGPS, setCarregandoGPS] = useState(false)
  const [postComentando, setPostComentando] = useState(null)
  const [textoComentario, setTextoComentario] = useState("")
  const [comentarios, setComentarios] = useState<any>({})
  const [limiteAtingido, setLimiteAtingido] = useState(false)
  const pathname = usePathname()

  // Pega usuário logado e nome real
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user)
        try {
          const docSnap = await getDoc(doc(db, "usuarios", user.uid))
          if (docSnap.exists()) {
            setNomeUsuario(docSnap.data().nome || user.email?.split("@")[0] || "Usuária")
          } else {
            setNomeUsuario(user.email?.split("@")[0] || "Usuária")
          }
        } catch {
          setNomeUsuario(user.email?.split("@")[0] || "Usuária")
        }
      }
    })
    return () => unsub()
  }, [])

  // Carrega posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("criado_em", "desc"))
    const unsub = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter((p: any) => p.criado_em && (p.denuncias || 0) < 5)
      setPosts(dados)
    })
    return () => unsub()
  }, [])

  async function verificarLimite() {
    if (!usuario) return false
    const umaHoraAtras = new Date(Date.now() - 3600000)
    const q = query(
      collection(db, "posts"),
      where("usuario_id", "==", usuario.uid),
      where("criado_em", ">=", umaHoraAtras)
    )
    const snap = await getDocs(q)
    return snap.size >= 5
  }

  async function obterGPS() {
    setCarregandoGPS(true)
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          )
          const data = await res.json()
          const end = data.address
          const local = [end.road, end.suburb || end.neighbourhood, end.city || end.town]
            .filter(Boolean).join(", ")
          setLocalizacao(local || "Local atual")
        } catch {
          setLocalizacao("Local atual")
        }
        setCarregandoGPS(false)
      },
      () => { setLocalizacao(""); setCarregandoGPS(false) }
    )
  }

  async function publicar() {
    if (!texto.trim()) return
    const limite = await verificarLimite()
    if (limite) { setLimiteAtingido(true); return }
    await addDoc(collection(db, "posts"), {
      texto: filtrarTexto(texto),
      tipo, anonimo,
      localizacao: localizacao || null,
      nome: anonimo ? "Anônimo" : nomeUsuario,
      usuario_id: anonimo ? null : (usuario?.uid || null),
      curtidas: 0,
      curtidas_por: [],
      confirmacoes: 0,
      confirmacoes_por: [],
      denuncias: 0,
      comentarios: 0,
      criado_em: serverTimestamp()
    })
    setTexto(""); setTipo("relato"); setLocalizacao("")
    setAnonimo(false); setModalAberto(false); setLimiteAtingido(false)
  }

  async function curtir(postId, jaGostou) {
    if (!usuario) return
    const ref = doc(db, "posts", postId)
    if (jaGostou) {
      await updateDoc(ref, {
        curtidas: increment(-1),
        curtidas_por: arrayRemove(usuario.uid)
      })
    } else {
      await updateDoc(ref, {
        curtidas: increment(1),
        curtidas_por: arrayUnion(usuario.uid)
      })
    }
  }

  async function confirmar(postId, jaConfirmou) {
    if (!usuario) return
    const ref = doc(db, "posts", postId)
    if (jaConfirmou) {
      await updateDoc(ref, {
        confirmacoes: increment(-1),
        confirmacoes_por: arrayRemove(usuario.uid)
      })
    } else {
      await updateDoc(ref, {
        confirmacoes: increment(1),
        confirmacoes_por: arrayUnion(usuario.uid)
      })
    }
  }

  async function denunciar(postId) {
    await updateDoc(doc(db, "posts", postId), { denuncias: increment(1) })
    alert("Post denunciado. Obrigada por ajudar a manter a comunidade segura.")
  }

  async function carregarComentarios(postId) {
    if (postComentando === postId) { setPostComentando(null); return }
    setPostComentando(postId)
    const q = query(collection(db, "posts", postId, "comentarios"), orderBy("criado_em", "asc"))
    onSnapshot(q, (snap) => {
      setComentarios(prev => ({
        ...prev,
        [postId]: snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }))
    })
  }

  async function enviarComentario(postId) {
    if (!textoComentario.trim()) return
    await addDoc(collection(db, "posts", postId, "comentarios"), {
      texto: filtrarTexto(textoComentario),
      nome: nomeUsuario,
      usuario_id: usuario?.uid || null,
      criado_em: serverTimestamp()
    })
    await updateDoc(doc(db, "posts", postId), { comentarios: increment(1) })
    setTextoComentario("")
  }

  const postsFiltrados = posts
    .filter(p => filtroTipo === "todos" || p.tipo === filtroTipo)
    .sort((a, b) => {
      if (ordenacao === "relevantes") {
        return ((b.confirmacoes || 0) + (b.curtidas || 0)) - ((a.confirmacoes || 0) + (a.curtidas || 0))
      }
      return 0
    })

  const tipoInfo = (t) => TIPOS.find(x => x.valor === t) || TIPOS[0]

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px 160px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Comunidade</h2>
        <p style={{ color: cores.lavanda, marginBottom: "20px", fontSize: "14px" }}>
          Compartilhe experiências e dicas de segurança
        </p>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {["recentes", "relevantes"].map(ord => (
            <button key={ord} onClick={() => setOrdenacao(ord)} style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "12px",
              border: `1.5px solid ${ordenacao === ord ? cores.roxo : "rgba(90,73,151,0.2)"}`,
              backgroundColor: ordenacao === ord ? cores.roxo : cores.branco,
              color: ordenacao === ord ? cores.branco : cores.lavanda,
              cursor: "pointer", fontWeight: ordenacao === ord ? "600" : "400"
            }}>
              {ord === "recentes" ? "Mais recentes" : "Mais relevantes"}
            </button>
          ))}
          {([{ valor: "todos", label: "Todos", cor: undefined, fundo: undefined }, ...TIPOS]).map(t => (
            <button key={t.valor} onClick={() => setFiltroTipo(t.valor)} style={{
              padding: "6px 14px", borderRadius: "20px", fontSize: "12px",
              border: `1.5px solid ${filtroTipo === t.valor ? (t.cor || cores.roxo) : "rgba(90,73,151,0.2)"}`,
              backgroundColor: filtroTipo === t.valor ? (t.fundo || "rgba(90,73,151,0.1)") : cores.branco,
              color: filtroTipo === t.valor ? (t.cor || cores.roxo) : cores.lavanda,
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
              {/* Cabeçalho */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    backgroundColor: post.anonimo ? "#e5e7eb" : cores.fundo,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {post.anonimo ? <Lock size={16} color={cores.lavanda} /> : <User size={16} color={cores.roxo} />}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: cores.roxoEscuro }}>
                      {post.nome}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#bbb" }}>
                      {formatarData(post.criado_em)}
                    </p>
                  </div>
                </div>
                <span style={{
                  padding: "4px 10px", borderRadius: "20px", fontSize: "11px",
                  fontWeight: "600", backgroundColor: info.fundo, color: info.cor,
                  alignSelf: "flex-start"
                }}>
                  {info.label}
                </span>
              </div>

              {/* Texto */}
              <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: "1.6", color: "#333" }}>
                {post.texto}
              </p>

              {/* Localização */}
              {post.localizacao && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
                  <MapPin size={12} color={cores.lavanda} />
                  <span style={{ fontSize: "12px", color: cores.lavanda }}>{post.localizacao}</span>
                </div>
              )}

              {/* Ações */}
              <div style={{
                display: "flex", gap: "12px", paddingTop: "10px",
                borderTop: `1px solid ${cores.fundo}`, flexWrap: "wrap",
                alignItems: "center"
              }}>
                {/* Curtir */}
                <button onClick={() => curtir(post.id, jaGostou)} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "none", border: "none", cursor: "pointer",
                  color: jaGostou ? "#e11d48" : cores.lavanda, fontSize: "12px", padding: 0
                }}>
                  <Heart size={14} fill={jaGostou ? "#e11d48" : "none"} />
                  {post.curtidas || 0}
                </button>

                {/* Confirmar */}
                <button onClick={() => confirmar(post.id, jaConfirmou)} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "none", border: "none", cursor: "pointer",
                  color: jaConfirmou ? "#16a34a" : cores.lavanda, fontSize: "12px", padding: 0
                }}>
                  <ThumbsUp size={14} fill={jaConfirmou ? "#16a34a" : "none"} />
                  {post.confirmacoes || 0} confirmações
                </button>

                {/* Comentários */}
                <button onClick={() => carregarComentarios(post.id)} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "none", border: "none", cursor: "pointer",
                  color: postComentando === post.id ? cores.roxo : cores.lavanda,
                  fontSize: "12px", padding: 0
                }}>
                  <MessageSquare size={14} />
                  {post.comentarios || 0}
                </button>

                {/* Denunciar */}
                <button onClick={() => denunciar(post.id)} style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#dc2626", fontSize: "12px", padding: 0, marginLeft: "auto"
                }}>
                  <Flag size={14} /> Denunciar
                </button>
              </div>

              {/* Seção comentários */}
              {postComentando === post.id && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${cores.fundo}` }}>
                  {(comentarios[post.id] || []).map(c => (
                    <div key={c.id} style={{
                      backgroundColor: cores.fundo, borderRadius: "10px",
                      padding: "10px 12px", marginBottom: "8px"
                    }}>
                      <p style={{ margin: "0 0 4px", fontWeight: "600", fontSize: "12px", color: cores.roxoEscuro }}>
                        {c.nome}
                      </p>
                      <p style={{ margin: 0, fontSize: "13px", color: "#444" }}>{c.texto}</p>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <input
                      placeholder="Escreva um comentário..."
                      value={textoComentario}
                      onChange={(e) => setTextoComentario(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && enviarComentario(post.id)}
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: "10px",
                        border: `1.5px solid #E8E0F5`, outline: "none",
                        fontSize: "13px", color: "#333"
                      }}
                    />
                    <button onClick={() => enviarComentario(post.id)} style={{
                      padding: "10px 16px", backgroundColor: cores.roxo,
                      color: cores.branco, border: "none", borderRadius: "10px",
                      cursor: "pointer", fontSize: "13px", fontWeight: "600"
                    }}>
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {postsFiltrados.length === 0 && (
          <div style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "32px", textAlign: "center",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)"
          }}>
            <MessageSquare size={40} color={cores.roxoClaro} style={{ marginBottom: "12px" }} />
            <p style={{ color: cores.lavanda, margin: 0 }}>Nenhum post encontrado.</p>
          </div>
        )}
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
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "17px" }}>Nova Publicação</h3>
              <button onClick={() => setModalAberto(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color={cores.lavanda} />
              </button>
            </div>

            {/* Tipo */}
            <p style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro, marginBottom: "8px" }}>
              Tipo de publicação
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {TIPOS.map(t => (
                <button key={t.valor} onClick={() => setTipo(t.valor)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: "12px", fontSize: "12px",
                  border: `2px solid ${tipo === t.valor ? t.cor : "rgba(90,73,151,0.15)"}`,
                  backgroundColor: tipo === t.valor ? t.fundo : cores.branco,
                  color: tipo === t.valor ? t.cor : cores.lavanda,
                  cursor: "pointer", fontWeight: tipo === t.valor ? "700" : "400"
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Texto */}
            <textarea
              placeholder="Descreva o ocorrido..."
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

            {/* Localização */}
            <p style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro, marginBottom: "8px" }}>
              Localização
            </p>
            <button onClick={obterGPS} style={{
              padding: "10px 14px", borderRadius: "10px", fontSize: "12px", marginBottom: "8px",
              border: `1.5px solid rgba(90,73,151,0.2)`,
              backgroundColor: cores.branco, color: cores.lavanda,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
            }}>
              <MapPin size={14} />
              {carregandoGPS ? "Obtendo localização..." : "Usar localização atual"}
            </button>
            <input
              placeholder="Ou escreva o local (ex: Rua das Flores, Centro)"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px",
                borderRadius: "12px", border: `1.5px solid #E8E0F5`,
                marginBottom: "16px", fontSize: "13px",
                boxSizing: "border-box", outline: "none", color: "#333"
              }}
            />

            {/* Anônimo */}
            <label style={{
              fontSize: "13px", color: cores.lavanda,
              display: "flex", alignItems: "center", gap: "8px",
              cursor: "pointer", marginBottom: "16px"
            }}>
              <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} />
              Publicar anonimamente
            </label>

            {limiteAtingido && (
              <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>
                Limite de 5 posts por hora atingido. Tente novamente mais tarde.
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setModalAberto(false)} style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                border: `1px solid ${cores.roxoClaro}`, backgroundColor: "transparent",
                color: cores.roxo, cursor: "pointer", fontSize: "14px"
              }}>
                Cancelar
              </button>
              <button onClick={publicar} style={{
                flex: 2, padding: "12px", borderRadius: "12px",
                border: "none", backgroundColor: cores.roxo,
                color: cores.branco, cursor: "pointer",
                fontSize: "14px", fontWeight: "600"
              }}>
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão nova publicação */}
      <div style={{ position: "fixed", bottom: "60px", left: 0, right: 0 }}>
        <button onClick={() => setModalAberto(true)} style={{
          width: "100%", padding: "16px",
          backgroundColor: cores.roxo, color: cores.branco,
          border: "none", fontSize: "15px", fontWeight: "bold",
          cursor: "pointer"
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