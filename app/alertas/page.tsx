"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, orderBy, query, where, doc, updateDoc, getDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Users, MessageSquare, Home, Bell,
  AlertCircle, Shield, Smartphone, CheckCircle, Navigation
} from "lucide-react"
import Header from "../componentes/Header"

const cores = {
  fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF", lavanda: "#8575BD", amarelo: "#FDEA72", branco: "#FFFFFF"
}

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

function formatarTempo(isoString: string) {
  if (!isoString) return "agora"
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return "agora"
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return new Date(isoString).toLocaleDateString("pt-BR")
}

function CardAlerta({ alerta, meu, nomes, resolverAlerta, cores }: any) {
  const nome = meu ? "Você" : (nomes[alerta.usuario_id] || "Usuária do círculo")
  const origem = alerta.origem === "dispositivo_echo" ? "Artemis Echo" : "App"
  const ativo = alerta.ativo !== false
  const linkMapa = alerta.latitude
    ? "https://maps.google.com/?q=" + alerta.latitude + "," + alerta.longitude
    : null

  return (
    <div style={{
      backgroundColor: cores.branco, borderRadius: "16px",
      padding: "16px", marginBottom: "12px",
      boxShadow: "0 1px 6px rgba(90,73,151,0.07)",
      borderLeft: "4px solid " + (ativo ? "#ef4444" : "#22c55e")
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%",
            backgroundColor: ativo ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {ativo
              ? <AlertCircle size={20} color="#ef4444" />
              : <CheckCircle size={20} color="#22c55e" />
            }
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: cores.roxoEscuro }}>
              {nome}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              {alerta.origem === "dispositivo_echo"
                ? <Smartphone size={12} color={cores.lavanda} />
                : <Shield size={12} color={cores.lavanda} />
              }
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda }}>
                {origem} • {formatarTempo(alerta.criado_em)}
              </p>
            </div>
          </div>
        </div>
        <span style={{
          fontSize: "11px", fontWeight: "700",
          color: ativo ? "#ef4444" : "#22c55e",
          backgroundColor: ativo ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          padding: "4px 10px", borderRadius: "10px"
        }}>
          {ativo ? "Ativo" : "Resolvido"}
        </span>
      </div>

      {alerta.mensagem && (
        <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#555", lineHeight: "1.5" }}>
          {alerta.mensagem}
        </p>
      )}

      {linkMapa && (
        <a href={linkMapa} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", gap: "6px",
          backgroundColor: cores.fundo, borderRadius: "10px",
          padding: "8px 12px", marginBottom: "10px",
          textDecoration: "none"
        }}>
          <Navigation size={14} color={cores.roxo} />
          <span style={{ fontSize: "12px", color: cores.roxo, fontWeight: "600" }}>
            Ver localização no mapa
          </span>
        </a>
      )}

      {ativo && (
        <div style={{ display: "flex", gap: "8px" }}>
          <a href="tel:190" style={{
            flex: 1, padding: "10px", borderRadius: "10px", fontSize: "13px",
            backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626",
            border: "1px solid rgba(239,68,68,0.2)", textDecoration: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "6px", fontWeight: "600"
          }}>
            Ligar 190
          </a>
          <button onClick={() => resolverAlerta(alerta.id)} style={{
            flex: 1, padding: "10px", borderRadius: "10px", fontSize: "13px",
            backgroundColor: "rgba(34,197,94,0.1)", color: "#16a34a",
            border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer",
            fontWeight: "600"
          }}>
            Marcar resolvido
          </button>
        </div>
      )}
    </div>
  )
}

export default function Alertas() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [alertasRecebidos, setAlertasRecebidos] = useState<any[]>([])
  const [meusSOS, setMeusSOS] = useState<any[]>([])
  const [aba, setAba] = useState("recebidos")
  const [nomes, setNomes] = useState({})

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!usuario) return
    const qCirculo = query(
      collection(db, "circulos"),
      where("usuarios", "array-contains", usuario.uid),
      where("status", "==", "confirmado")
    )
    const unsub = onSnapshot(qCirculo, async (snapCirculo) => {
      const idsCirculo = snapCirculo.docs.flatMap(d => {
        const data = d.data()
        return data.usuarios.filter(id => id !== usuario.uid)
      })
      if (idsCirculo.length === 0) return
      const nomesTemp = {}
      await Promise.all(idsCirculo.map(async (id) => {
        try {
          const perfil = await getDoc(doc(db, "usuarios", id))
          nomesTemp[id] = perfil.data()?.nome || "Usuária"
        } catch { nomesTemp[id] = "Usuária" }
      }))
      setNomes(nomesTemp)
      const qAlertas = query(
        collection(db, "alertas_sos"),
        where("usuario_id", "in", idsCirculo),
        orderBy("criado_em", "desc")
      )
      onSnapshot(qAlertas, (snap) => {
        setAlertasRecebidos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      })
    })
    return () => unsub()
  }, [usuario])

  useEffect(() => {
    if (!usuario) return
    const q = query(
      collection(db, "alertas_sos"),
      where("usuario_id", "==", usuario.uid),
      orderBy("criado_em", "desc")
    )
    const unsub = onSnapshot(q, (snap) => {
      setMeusSOS(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [usuario])

  async function resolverAlerta(alertaId) {
    await updateDoc(doc(db, "alertas_sos", alertaId), { ativo: false })
  }

  const alertasAtivos = alertasRecebidos.filter(a => a.ativo !== false)
  const listaAtual = aba === "recebidos" ? alertasRecebidos : meusSOS

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px 100px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: cores.roxoEscuro, margin: 0 }}>Alertas</h2>
          {alertasAtivos.length > 0 && (
            <span style={{
              backgroundColor: "#ef4444", color: "white",
              fontSize: "12px", fontWeight: "700",
              padding: "4px 10px", borderRadius: "12px"
            }}>
              {alertasAtivos.length} ativo{alertasAtivos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p style={{ color: cores.lavanda, fontSize: "13px", marginBottom: "20px" }}>
          Alertas do seu círculo em tempo real
        </p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            { id: "recebidos", label: "Recebidos", count: alertasRecebidos.length },
            { id: "meus", label: "Meus alertas", count: meusSOS.length },
          ].map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)} style={{
              padding: "8px 16px", borderRadius: "20px", fontSize: "13px",
              border: "1.5px solid " + (aba === tab.id ? cores.roxo : "rgba(90,73,151,0.2)"),
              backgroundColor: aba === tab.id ? cores.roxo : cores.branco,
              color: aba === tab.id ? cores.branco : cores.lavanda,
              cursor: "pointer", fontWeight: aba === tab.id ? "600" : "400",
              display: "flex", alignItems: "center", gap: "6px"
            }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  backgroundColor: aba === tab.id ? "rgba(255,255,255,0.3)" : cores.roxoClaro,
                  color: aba === tab.id ? "white" : cores.roxoEscuro,
                  fontSize: "11px", fontWeight: "700",
                  padding: "1px 7px", borderRadius: "10px"
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {listaAtual.length === 0 ? (
          <div style={{
            backgroundColor: cores.branco, borderRadius: "16px",
            padding: "40px 24px", textAlign: "center",
            boxShadow: "0 1px 6px rgba(90,73,151,0.07)"
          }}>
            <Bell size={40} color={cores.roxoClaro} style={{ marginBottom: "12px" }} />
            <p style={{ color: cores.lavanda, fontSize: "14px", margin: 0 }}>
              {aba === "recebidos"
                ? "Nenhum alerta do seu círculo ainda."
                : "Você não acionou nenhum alerta ainda."}
            </p>
            <p style={{ color: "#bbb", fontSize: "12px", marginTop: "6px" }}>
              {aba === "recebidos"
                ? "Quando alguém do seu círculo acionar o SOS, aparece aqui."
                : "Seus alertas SOS aparecerão aqui."}
            </p>
          </div>
        ) : (
          listaAtual.map(alerta => (
            <CardAlerta
              key={alerta.id}
              alerta={alerta}
              meu={aba === "meus"}
              nomes={nomes}
              resolverAlerta={resolverAlerta}
              cores={cores}
            />
          ))
        )}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: cores.branco, borderTop: "1px solid " + cores.fundo,
        display: "flex", justifyContent: "space-around",
        padding: "10px 0", boxShadow: "0 -2px 12px rgba(90,73,151,0.08)"
      }}>
        {nav.map((item) => {
          const ativo = pathname === item.href
          return (
            <Link key={item.label} href={item.href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
              textDecoration: "none", color: ativo ? cores.roxo : "#aaa", position: "relative"
            }}>
              <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? "rgba(90,73,151,0.1)" : "transparent", position: "relative" }}>
                <item.icon size={20} />
                {item.href === "/alertas" && alertasAtivos.length > 0 && (
                  <div style={{
                    position: "absolute", top: "4px", right: "10px",
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: "#ef4444", border: "2px solid " + cores.branco
                  }} />
                )}
              </div>
              <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}