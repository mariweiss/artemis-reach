"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection, addDoc, onSnapshot, doc, getDoc,
  updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove
} from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import {
  MapPin, Users, MessageSquare, Home, Bell,
  Phone, AlertCircle, Link as LinkIcon, Check,
  X, ChevronRight, Wifi, WifiOff, Shield, Trash2,
  Plus, UserPlus, Settings, ChevronDown, ChevronUp
} from "lucide-react"
import Link from "next/link"
import Header from "../componentes/Header"

const cores = {
  fundo: "#EEEAF8", fundoCard: "#F5F2FC",
  roxo: "#5A4997", roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF", lavanda: "#8575BD", branco: "#FFFFFF",
}

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

const CORES_GRUPOS = ["#5A4997", "#e11d48", "#0891b2", "#16a34a", "#d97706", "#7c3aed"]

export default function Circulo() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [grupos, setGrupos] = useState<any[]>([])
  const [conexoes, setConexoes] = useState<any[]>([])
  const [convitesPendentes, setConvitesPendentes] = useState<any[]>([])
  const [grupoExpandido, setGrupoExpandido] = useState<string | null>(null)
  const [modalNovoGrupo, setModalNovoGrupo] = useState(false)
  const [modalConviteGrupo, setModalConviteGrupo] = useState<any>(null)
  const [nomeGrupo, setNomeGrupo] = useState("")
  const [corSelecionada, setCorSelecionada] = useState(CORES_GRUPOS[0])
  const [linkGerado, setLinkGerado] = useState("")
  const [modalLink, setModalLink] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState("grupos")

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid))
        if (snap.exists()) setNomeUsuario(snap.data().nome?.split(" ")[0] || "Usuária")
      } catch { }
      setCarregando(false)
    })
    return () => unsub()
  }, [])

  // Carrega grupos do usuário
  useEffect(() => {
    if (!usuario) return
    const q = query(
      collection(db, "grupos"),
      where("membros", "array-contains", usuario.uid)
    )
    const unsub = onSnapshot(q, async (snap) => {
      const dados = await Promise.all(snap.docs.map(async (d) => {
        const data = d.data()
        // Busca nomes dos membros
        const membrosDetalhes = await Promise.all(
          (data.membros || []).map(async (id: string) => {
            try {
              const perfil = await getDoc(doc(db, "usuarios", id))
              return { id, nome: perfil.data()?.nome || "Usuária" }
            } catch { return { id, nome: "Usuária" } }
          })
        )
        return { id: d.id, ...data, membrosDetalhes }
      }))
      setGrupos(dados)
    })
    return () => unsub()
  }, [usuario])

  // Carrega conexões individuais
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
        const outroId = data.usuarios.find((id: string) => id !== usuario.uid)
        try {
          const perfil = await getDoc(doc(db, "usuarios", outroId))
          return { id: d.id, ...data, outroId, nome: perfil.data()?.nome || "Usuária", telefone: perfil.data()?.telefone || "" }
        } catch { return { id: d.id, ...data, outroId, nome: "Usuária", telefone: "" } }
      }))
      setConexoes(dados)
    })
    return () => unsub()
  }, [usuario])

  // Convites pendentes
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
          return { id: d.id, ...data, nomeCriador: perfil.data()?.nome || "Usuária" }
        } catch { return { id: d.id, ...data, nomeCriador: "Usuária" } }
      }))
      setConvitesPendentes(dados)
    })
    return () => unsub()
  }, [usuario])

  async function criarGrupo() {
    if (!nomeGrupo.trim()) return
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    await addDoc(collection(db, "grupos"), {
      nome: nomeGrupo.trim(),
      cor: corSelecionada,
      criador_id: usuario.uid,
      membros: [usuario.uid],
      token,
      criado_em: new Date().toISOString()
    })
    setNomeGrupo("")
    setCorSelecionada(CORES_GRUPOS[0])
    setModalNovoGrupo(false)
  }

  async function gerarLinkGrupo(grupo: any) {
    const link = `${window.location.origin}/entrar-grupo?token=${grupo.token}`
    setLinkGerado(link)
    setModalConviteGrupo(grupo)
    setModalLink(true)
  }

  async function gerarLinkIndividual() {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    await addDoc(collection(db, "convites"), {
      token,
      criador_id: usuario.uid,
      criador_nome: nomeUsuario,
      status: "pendente",
      expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      criado_em: new Date().toISOString()
    })
    const link = `${window.location.origin}/aceitar-convite?token=${token}`
    setLinkGerado(link)
    setModalConviteGrupo(null)
    setModalLink(true)
  }

  async function copiarLink() {
    await navigator.clipboard.writeText(linkGerado)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function removerDoGrupo(grupoId: string, membroId: string) {
    await updateDoc(doc(db, "grupos", grupoId), {
      membros: arrayRemove(membroId)
    })
  }

  async function deletarGrupo(grupoId: string) {
    await deleteDoc(doc(db, "grupos", grupoId))
  }

  async function aceitarConvite(convite: any) {
    await addDoc(collection(db, "circulos"), {
      usuarios: [convite.criador_id, usuario.uid],
      status: "confirmado",
      compartilha: { [convite.criador_id]: false, [usuario.uid]: false },
      criado_em: new Date().toISOString()
    })
    await updateDoc(doc(db, "convites", convite.id), { status: "aceito" })
  }

  async function recusarConvite(conviteId: string) {
    await updateDoc(doc(db, "convites", conviteId), { status: "recusado" })
  }

  async function enviarAlerta(destinatarioId: string) {
    await addDoc(collection(db, "alertas_sos"), {
      usuario_id: usuario?.uid,
      destinatario_id: destinatarioId,
      tipo: "alerta_circulo",
      mensagem: `${nomeUsuario} enviou um alerta para você.`,
      ativo: true,
      criado_em: new Date().toISOString()
    })
    alert("Alerta enviado!")
  }

  if (carregando) return (
    <div style={{ minHeight: "100vh", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `3px solid ${cores.roxo}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 120px" }}>

        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>Meu Círculo</h2>
        <p style={{ color: cores.lavanda, marginBottom: "20px", fontSize: "14px" }}>
          Sua rede privada de confiança
        </p>

        {/* Abas */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            { id: "grupos", label: "Grupos", count: grupos.length },
            { id: "contatos", label: "Contatos", count: conexoes.length },
          ].map(aba => (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} style={{
              padding: "8px 16px", borderRadius: "20px", fontSize: "13px",
              border: `1.5px solid ${abaAtiva === aba.id ? cores.roxo : "rgba(90,73,151,0.2)"}`,
              backgroundColor: abaAtiva === aba.id ? cores.roxo : cores.branco,
              color: abaAtiva === aba.id ? cores.branco : cores.lavanda,
              cursor: "pointer", fontWeight: abaAtiva === aba.id ? "600" : "400",
              display: "flex", alignItems: "center", gap: "6px"
            }}>
              {aba.label}
              {aba.count > 0 && (
                <span style={{
                  backgroundColor: abaAtiva === aba.id ? "rgba(255,255,255,0.3)" : cores.roxoClaro,
                  color: abaAtiva === aba.id ? "white" : cores.roxoEscuro,
                  fontSize: "11px", fontWeight: "700", padding: "1px 7px", borderRadius: "10px"
                }}>
                  {aba.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Convites pendentes */}
        {convitesPendentes.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Convites pendentes
            </p>
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
                  <button onClick={() => recusarConvite(convite.id)} style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={16} color="#ef4444" />
                  </button>
                  <button onClick={() => aceitarConvite(convite)} style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(34,197,94,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Check size={16} color="#16a34a" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA GRUPOS */}
        {abaAtiva === "grupos" && (
          <>
            {grupos.length === 0 ? (
              <div style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 1px 6px rgba(90,73,151,0.07)" }}>
                <Users size={40} color={cores.roxoClaro} style={{ marginBottom: "12px" }} />
                <p style={{ color: cores.lavanda, fontSize: "14px", margin: 0 }}>Nenhum grupo criado ainda.</p>
                <p style={{ color: "#bbb", fontSize: "13px", marginTop: "8px" }}>Crie grupos como Família, Amigos, Trabalho...</p>
              </div>
            ) : grupos.map((grupo) => (
              <div key={grupo.id} style={{ backgroundColor: cores.branco, borderRadius: "16px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 1px 6px rgba(90,73,151,0.07)" }}>
                {/* Header do grupo */}
                <div
                  onClick={() => setGrupoExpandido(grupoExpandido === grupo.id ? null : grupo.id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: grupo.cor || cores.roxo, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Users size={22} color="white" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: cores.roxoEscuro }}>{grupo.nome}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>
                        {grupo.membros?.length || 0} membro{(grupo.membros?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={(e) => { e.stopPropagation(); gerarLinkGrupo(grupo) }} style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: cores.fundo, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <LinkIcon size={15} color={cores.roxo} />
                    </button>
                    {grupo.criador_id === usuario?.uid && (
                      <button onClick={(e) => { e.stopPropagation(); deletarGrupo(grupo.id) }} style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Trash2 size={15} color="#ef4444" />
                      </button>
                    )}
                    {grupoExpandido === grupo.id ? <ChevronUp size={18} color={cores.lavanda} /> : <ChevronDown size={18} color={cores.lavanda} />}
                  </div>
                </div>

                {/* Membros do grupo expandido */}
                {grupoExpandido === grupo.id && (
                  <div style={{ borderTop: `1px solid ${cores.fundo}`, padding: "12px 16px" }}>
                    {(grupo.membrosDetalhes || []).map((membro: any) => (
                      <div key={membro.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${cores.fundo}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center", color: cores.roxo, fontWeight: "700", fontSize: "14px" }}>
                            {membro.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: cores.roxoEscuro }}>
                              {membro.nome} {membro.id === usuario?.uid ? "(você)" : ""}
                            </p>
                            {membro.id === grupo.criador_id && (
                              <p style={{ margin: 0, fontSize: "11px", color: cores.roxo }}>Criador</p>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {membro.id !== usuario?.uid && (
                            <>
                              <button onClick={() => enviarAlerta(membro.id)} style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                <AlertCircle size={15} color="#ef4444" />
                              </button>
                            </>
                          )}
                          {(grupo.criador_id === usuario?.uid && membro.id !== usuario?.uid) && (
                            <button onClick={() => removerDoGrupo(grupo.id, membro.id)} style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: cores.fundo, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <X size={15} color={cores.lavanda} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ABA CONTATOS */}
        {abaAtiva === "contatos" && (
          <>
            {conexoes.length === 0 ? (
              <div style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 1px 6px rgba(90,73,151,0.07)" }}>
                <UserPlus size={40} color={cores.roxoClaro} style={{ marginBottom: "12px" }} />
                <p style={{ color: cores.lavanda, fontSize: "14px", margin: 0 }}>Nenhum contato ainda.</p>
                <p style={{ color: "#bbb", fontSize: "13px", marginTop: "8px" }}>Gere um link para convidar pessoas.</p>
              </div>
            ) : conexoes.map((conexao) => (
              <div key={conexao.id} style={{ backgroundColor: cores.branco, borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 1px 6px rgba(90,73,151,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: cores.roxoClaro, display: "flex", alignItems: "center", justifyContent: "center", color: cores.roxoEscuro, fontWeight: "bold", fontSize: "16px" }}>
                      {conexao.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: cores.roxoEscuro }}>{conexao.nome}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>{conexao.telefone}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {conexao.telefone && (
                      <a href={`tel:${conexao.telefone.replace(/\D/g, "")}`} style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: cores.fundo, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                        <Phone size={16} color={cores.roxo} />
                      </a>
                    )}
                    <button onClick={() => enviarAlerta(conexao.outroId)} style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <AlertCircle size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Botões fixos */}
      <div style={{ position: "fixed", bottom: "60px", left: 0, right: 0, display: "flex" }}>
        <button onClick={() => setModalNovoGrupo(true)} style={{
          flex: 1, padding: "16px", backgroundColor: cores.branco,
          color: cores.roxo, border: "none", borderTop: `1px solid ${cores.fundo}`,
          fontSize: "14px", fontWeight: "600",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}>
          <Plus size={18} /> Novo grupo
        </button>
        <button onClick={gerarLinkIndividual} style={{
          flex: 1, padding: "16px", backgroundColor: cores.roxo,
          color: cores.branco, border: "none",
          fontSize: "14px", fontWeight: "600",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
        }}>
          <LinkIcon size={18} /> Convidar
        </button>
      </div>

      {/* Modal novo grupo */}
      {modalNovoGrupo && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ backgroundColor: cores.branco, width: "100%", borderRadius: "24px 24px 0 0", padding: "24px", boxShadow: "0 -4px 24px rgba(90,73,151,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "17px" }}>Criar novo grupo</h3>
              <button onClick={() => setModalNovoGrupo(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color={cores.lavanda} />
              </button>
            </div>

            <label style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro, display: "block", marginBottom: "8px" }}>
              Nome do grupo
            </label>
            <input
              placeholder="Ex: Família, Amigos, Trabalho..."
              value={nomeGrupo}
              onChange={(e) => setNomeGrupo(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: `1.5px solid #E8E0F5`, marginBottom: "16px", fontSize: "14px", boxSizing: "border-box", outline: "none", color: "#333" }}
            />

            <label style={{ fontSize: "13px", fontWeight: "600", color: cores.roxoEscuro, display: "block", marginBottom: "10px" }}>
              Cor do grupo
            </label>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              {CORES_GRUPOS.map(cor => (
                <button key={cor} onClick={() => setCorSelecionada(cor)} style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  backgroundColor: cor, border: corSelecionada === cor ? `3px solid ${cores.roxoEscuro}` : "3px solid transparent",
                  cursor: "pointer"
                }} />
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setModalNovoGrupo(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${cores.roxoClaro}`, backgroundColor: "transparent", color: cores.roxo, cursor: "pointer", fontSize: "14px" }}>
                Cancelar
              </button>
              <button onClick={criarGrupo} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: cores.roxo, color: cores.branco, cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                Criar grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal link */}
      {modalLink && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ backgroundColor: cores.branco, width: "100%", borderRadius: "24px 24px 0 0", padding: "24px", boxShadow: "0 -4px 24px rgba(90,73,151,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: cores.roxoEscuro, margin: 0, fontSize: "17px" }}>
                {modalConviteGrupo ? `Convidar para: ${modalConviteGrupo.nome}` : "Link de convite"}
              </h3>
              <button onClick={() => setModalLink(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color={cores.lavanda} />
              </button>
            </div>

            <div style={{ backgroundColor: cores.fundo, borderRadius: "12px", padding: "12px 16px", marginBottom: "12px", wordBreak: "break-all", fontSize: "13px", color: cores.roxo }}>
              {linkGerado}
            </div>

            <p style={{ color: cores.lavanda, fontSize: "12px", marginBottom: "16px" }}>
              {modalConviteGrupo
                ? "Qualquer pessoa com este link entrará diretamente neste grupo."
                : "Este link expira em 24 horas. Compartilhe apenas com pessoas de confiança."}
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
                const msg = modalConviteGrupo
                  ? `Olá! ${nomeUsuario} te convidou para o grupo "${modalConviteGrupo.nome}" no Artemis. Acesse: ${linkGerado}`
                  : `Olá! ${nomeUsuario} te convidou para o círculo de segurança no Artemis. Acesse: ${linkGerado}`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
              }} style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                border: "none", backgroundColor: "#25D366",
                color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600"
              }}>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

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