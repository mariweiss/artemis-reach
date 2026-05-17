"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection, addDoc, onSnapshot, doc, getDoc,
  updateDoc, deleteDoc, query, where, orderBy
} from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import {
  MapPin, Users, MessageSquare, Home, Bell,
  Phone, AlertCircle, Link as LinkIcon, Check,
  X, ChevronRight, Wifi, WifiOff, Shield, Trash2
} from "lucide-react"
import Link from "next/link"
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
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState(null)
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [conexoes, setConexoes] = useState<any[]>([])
  const [convitesPendentes, setConvitesPendentes] = useState<any[]>([])
  const [linkGerado, setLinkGerado] = useState("")
  const [modalLink, setModalLink] = useState(false)
  const [modalPerfil, setModalPerfil] = useState(null)
  const [compartilharLocalizacao, setCompartilharLocalizacao] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
      try {
        const docSnap = await getDoc(doc(db, "usuarios", user.uid))
        if (docSnap.exists()) setNomeUsuario(docSnap.data().nome?.split(" ")[0] || "Usuária")
      } catch {}
      setCarregando(false)
    })
    return () => unsub()
  }, [])

  // Carrega conexões confirmadas
  useEffect(() => {
    if (!usuario) return
    const q = query(
      collection(db, "circulos"),
      where("usuarios", "array-contains", usuario.uid),
      where("status", "==", "confirmado")
    )
    const unsub = onSnapshot(q, async (snap) => {
      const dados = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        const outroId = data.usuarios.find(id => id !== usuario.uid)
        try {
          const perfil = await getDoc(doc(db, "usuarios", outroId))
          return {
            id: d.id,
            ...data,
            outroId,
            nome: perfil.data()?.nome || "Usuário",
            telefone: perfil.data()?.telefone || "",
            compartilhaLocalizacao: data.compartilha?.[outroId] || false,
          }
        } catch {
          return { id: d.id, ...data, outroId, nome: "Usuário", telefone: "" }
        }
      }))
      setConexoes(dados)
    })
    return () => unsub()
  }, [usuario])

  // Carrega convites pendentes recebidos
  useEffect(() => {
    if (!usuario) return
    const q = query(
      collection(db, "convites"),
      where("convidado_id", "==", usuario.uid),
      where("status", "==", "pendente")
    )
    const unsub = onSnapshot(q, async (snap) => {
      const dados = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        try {
          const perfil = await getDoc(doc(db, "usuarios", data.criador_id))
          return { id: d.id, ...data, nomeCriador: perfil.data()?.nome || "Usuário" }
        } catch {
          return { id: d.id, ...data, nomeCriador: "Usuário" }
        }
      }))
      setConvitesPendentes(dados)
    })
    return () => unsub()
  }, [usuario])

  async function gerarLink() {
    if (!usuario) return
    const expiracao = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    await addDoc(collection(db, "convites"), {
      token,
      criador_id: usuario.uid,
      criador_nome: nomeUsuario,
      status: "pendente",
      expira_em: expiracao.toISOString(),
      criado_em: new Date().toISOString()
    })
    const link = `${window.location.origin}/aceitar-convite?token=${token}`
    setLinkGerado(link)
    setModalLink(true)
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(linkGerado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function aceitarConvite(convite) {
    await addDoc(collection(db, "circulos"), {
      usuarios: [convite.criador_id, usuario.uid],
      status: "confirmado",
      compartilha: { [convite.criador_id]: false, [usuario.uid]: false },
      criado_em: new Date().toISOString()
    })
    await updateDoc(doc(db, "convites", convite.id), { status: "aceito" })
  }

  async function recusarConvite(conviteId) {
    await updateDoc(doc(db, "convites", conviteId), { status: "recusado" })
  }

  async function removerConexao(conexaoId) {
    await deleteDoc(doc(db, "circulos", conexaoId))
  }

  async function toggleCompartilharLocalizacao(conexao) {
    const novoValor = !conexao.compartilhaLocalizacao
    await updateDoc(doc(db, "circulos", conexao.id), {
      [`compartilha.${usuario.uid}`]: novoValor
    })
  }

  async function enviarAlerta(contato) {
    await addDoc(collection(db, "alertas_sos"), {
      usuario_id: usuario?.uid,
      destinatario_id: contato.outroId,
      tipo: "alerta_circulo",
      mensagem: `${nomeUsuario} enviou um alerta para você.`,
      criado_em: new Date().toISOString()
    })
    alert(`Alerta enviado para ${contato.nome}!`)
  }

  if (carregando) return (
    <div style={{ minHeight: "100vh", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "50%",
        border: `3px solid ${cores.roxo}`, borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Meu Círculo</h2>
        <p style={{ color: cores.lavanda, marginBottom: "20px", fontSize: "14px" }}>
          Sua rede privada de confiança
        </p>

        {/* Convites pendentes */}
        {convitesPendentes.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ color: cores.roxoEscuro, fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>
              Convites pendentes
            </h3>
            {convitesPendentes.map(convite => (
              <div key={convite.id} style={{
                backgroundColor: cores.branco, borderRadius: "14px",
                padding: "14px 16px", marginBottom: "8px",
                boxShadow: "0 1px 4px rgba(90,73,151,0.08)",
                border: `1px solid ${cores.roxoClaro}`,
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: cores.roxoEscuro }}>
                    {convite.nomeCriador}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>
                    Quer entrar no seu círculo
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => recusarConvite(convite.id)} style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    backgroundColor: "rgba(239,68,68,0.1)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer"
                  }}>
                    <X size={16} color="#ef4444" />
                  </button>
                  <button onClick={() => aceitarConvite(convite)} style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    backgroundColor: "rgba(34,197,94,0.1)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer"
                  }}>
                    <Check size={16} color="#16a34a" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Privacidade */}
        <div style={{
          backgroundColor: cores.branco, borderRadius: "14px",
          padding: "14px 16px", marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(90,73,151,0.06)",
          display: "flex", alignItems: "center", gap: "12px"
        }}>
          <Shield size={20} color={cores.roxo} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro }}>
              Compartilhar minha localização
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: cores.lavanda }}>
              Visível para todos do seu círculo
            </p>
          </div>
          <button onClick={() => setCompartilharLocalizacao(!compartilharLocalizacao)} style={{
            width: "44px", height: "24px", borderRadius: "12px",
            backgroundColor: compartilharLocalizacao ? cores.roxo : "#e5e7eb",
            border: "none", cursor: "pointer", position: "relative",
            transition: "background-color 0.2s"
          }}>
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%",
              backgroundColor: "white", position: "absolute",
              top: "3px", transition: "left 0.2s",
              left: compartilharLocalizacao ? "23px" : "3px"
            }} />
          </button>
        </div>

        {/* Lista de conexões */}
        {conexoes.length === 0 ? (
          <div style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "32px", textAlign: "center",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)"
          }}>
            <Users size={40} color={cores.roxoClaro} style={{ marginBottom: "12px" }} />
            <p style={{ color: cores.lavanda, fontSize: "14px", margin: 0 }}>
              Seu círculo está vazio.
            </p>
            <p style={{ color: "#bbb", fontSize: "13px", marginTop: "8px" }}>
              Gere um link para convidar pessoas de confiança.
            </p>
          </div>
        ) : (
          conexoes.map((conexao) => (
            <div key={conexao.id} style={{
              backgroundColor: cores.branco, borderRadius: "16px",
              padding: "16px", marginBottom: "12px",
              boxShadow: "0 1px 6px rgba(90,73,151,0.07)"
            }}>
              <div
                onClick={() => setModalPerfil(conexao)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      backgroundColor: cores.roxoClaro, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: cores.roxoEscuro, fontWeight: "bold", fontSize: "16px"
                    }}>
                      {conexao.nome?.charAt(0).toUpperCase()}
                    </div>
                    {/* Indicador online/offline */}
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: "12px", height: "12px", borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      border: "2px solid white"
                    }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: cores.roxoEscuro }}>
                      {conexao.nome}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>
                      {conexao.telefone}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} color={cores.lavanda} />
              </div>

              {/* Ações rápidas */}
              <div style={{
                display: "flex", gap: "8px", marginTop: "12px",
                paddingTop: "12px", borderTop: `1px solid ${cores.fundo}`
              }}>
                <button onClick={() => toggleCompartilharLocalizacao(conexao)} style={{
                  flex: 1, padding: "8px", borderRadius: "10px", fontSize: "12px",
                  border: `1px solid ${conexao.compartilhaLocalizacao ? cores.roxo : "rgba(90,73,151,0.2)"}`,
                  backgroundColor: conexao.compartilhaLocalizacao ? `rgba(90,73,151,0.1)` : "transparent",
                  color: conexao.compartilhaLocalizacao ? cores.roxo : cores.lavanda,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "6px"
                }}>
                  {conexao.compartilhaLocalizacao ? <Wifi size={14} /> : <WifiOff size={14} />}
                  {conexao.compartilhaLocalizacao ? "Compartilhando" : "Compartilhar"}
                </button>

                <a href={`tel:${conexao.telefone?.replace(/\D/g, "")}`} style={{
                  flex: 1, padding: "8px", borderRadius: "10px", fontSize: "12px",
                  border: "1px solid rgba(90,73,151,0.2)",
                  backgroundColor: "transparent", color: cores.lavanda,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "6px", textDecoration: "none"
                }}>
                  <Phone size={14} /> Ligar
                </a>

                <button onClick={() => enviarAlerta(conexao)} style={{
                  flex: 1, padding: "8px", borderRadius: "10px", fontSize: "12px",
                  border: "1px solid rgba(239,68,68,0.3)",
                  backgroundColor: "rgba(239,68,68,0.08)", color: "#dc2626",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "6px"
                }}>
                  <AlertCircle size={14} /> Alertar
                </button>

                <button onClick={() => removerConexao(conexao.id)} style={{
                  width: "36px", padding: "8px", borderRadius: "10px",
                  border: "none", backgroundColor: "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Trash2 size={14} color="#bbb" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botão gerar link */}
      <div style={{ position: "fixed", bottom: "70px", left: 0, right: 0, padding: "0 24px" }}>
        <button onClick={gerarLink} style={{
          width: "100%", padding: "16px",
          backgroundColor: cores.roxo, color: cores.branco,
          border: "none", borderRadius: "16px",
          fontSize: "15px", fontWeight: "bold",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(90,73,151,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}>
          <LinkIcon size={18} /> Gerar link de convite
        </button>
      </div>

      {/* Modal link gerado */}
      {modalLink && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 200, display: "flex", alignItems: "flex-end"
        }}>
          <div style={{
            backgroundColor: cores.branco, width: "100%",
            borderRadius: "24px 24px 0 0", padding: "24px",
            boxShadow: "0 -4px 24px rgba(90,73,151,0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "17px" }}>Link de convite gerado</h3>
              <button onClick={() => setModalLink(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color={cores.lavanda} />
              </button>
            </div>

            <div style={{
              backgroundColor: cores.fundo, borderRadius: "12px",
              padding: "12px 16px", marginBottom: "12px",
              wordBreak: "break-all", fontSize: "13px", color: cores.roxo
            }}>
              {linkGerado}
            </div>

            <p style={{ color: cores.lavanda, fontSize: "12px", marginBottom: "16px" }}>
              Este link expira em 24 horas. Compartilhe apenas com pessoas de confiança.
            </p>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={copiarLink} style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                border: `1px solid ${cores.roxoClaro}`,
                backgroundColor: copiado ? `rgba(90,73,151,0.1)` : "transparent",
                color: cores.roxo, cursor: "pointer", fontSize: "14px", fontWeight: "600"
              }}>
                {copiado ? "✓ Copiado!" : "Copiar link"}
              </button>
              <button onClick={() => {
                const msg = `Olá! ${nomeUsuario} te convidou para o círculo de segurança no Artemis. Acesse: ${linkGerado}`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
              }} style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                border: "none", backgroundColor: "#25D366",
                color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600"
              }}>
                Enviar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal perfil do contato */}
      {modalPerfil && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 200, display: "flex", alignItems: "flex-end"
        }}>
          <div style={{
            backgroundColor: cores.branco, width: "100%",
            borderRadius: "24px 24px 0 0", padding: "24px",
            boxShadow: "0 -4px 24px rgba(90,73,151,0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "17px" }}>Perfil do contato</h3>
              <button onClick={() => setModalPerfil(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color={cores.lavanda} />
              </button>
            </div>

            {/* Avatar e nome */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                backgroundColor: cores.roxoClaro, display: "flex",
                alignItems: "center", justifyContent: "center",
                color: cores.roxoEscuro, fontWeight: "800", fontSize: "28px",
                margin: "0 auto 12px"
              }}>
                {modalPerfil.nome?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "18px" }}>{modalPerfil.nome}</h3>
              <p style={{ color: cores.lavanda, margin: "4px 0 0", fontSize: "14px" }}>{modalPerfil.telefone}</p>
            </div>

            {/* Ações */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <a href={`tel:${modalPerfil.telefone?.replace(/\D/g, "")}`} style={{
                flex: 1, padding: "14px", borderRadius: "14px",
                border: `1px solid rgba(90,73,151,0.2)`,
                backgroundColor: cores.fundo, color: cores.roxo,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px", textDecoration: "none",
                fontWeight: "600", fontSize: "14px"
              }}>
                <Phone size={18} /> Ligar
              </a>
              <button onClick={() => { enviarAlerta(modalPerfil); setModalPerfil(null) }} style={{
                flex: 1, padding: "14px", borderRadius: "14px",
                border: "none", backgroundColor: "rgba(239,68,68,0.1)",
                color: "#dc2626", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", fontWeight: "600", fontSize: "14px"
              }}>
                <AlertCircle size={18} /> Alertar
              </button>
            </div>

            {/* Localização e áreas frequentes */}
            <div style={{
              backgroundColor: cores.fundo, borderRadius: "14px", padding: "14px 16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <MapPin size={16} color={cores.roxo} />
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro }}>
                  Localização em tempo real
                </p>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>
                {modalPerfil.compartilhaLocalizacao
                  ? "Compartilhando localização com você"
                  : "Não está compartilhando localização"}
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#bbb" }}>
                Áreas frequentes mostram apenas regiões aproximadas mediante consentimento explícito.
              </p>
            </div>

            <button onClick={() => removerConexao(modalPerfil.id)} style={{
              width: "100%", marginTop: "12px", padding: "12px",
              backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px",
              cursor: "pointer", fontSize: "14px", fontWeight: "600"
            }}>
              Remover do círculo
            </button>
          </div>
        </div>
      )}

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
              textDecoration: "none", color: ativo ? cores.roxo : "#aaa",
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