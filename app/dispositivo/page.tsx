"use client"

import { useState, useEffect, useRef } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  MapPin, Users, MessageSquare, Home, Bell,
  Bluetooth, BluetoothOff, BluetoothSearching,
  Volume2, Shield, AlertCircle,
  CheckCircle, XCircle
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

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
const CHAR_SOS_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"

export default function Dispositivo() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [status, setStatus] = useState("desconectado")
  const [log, setLog] = useState<any[]>([])
  const [suportaBLE, setSuportaBLE] = useState(true)
  const deviceRef = useRef<any>(null)
  const cmdCharRef = useRef<any>(null)

  useEffect(() => {
    if (!(navigator as any).bluetooth) setSuportaBLE(false)
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/"); return }
      setUsuario(user)
    })
    return () => unsub()
  }, [])

  function adicionarLog(msg: string, tipo: string = "info") {
    const hora = new Date().toLocaleTimeString("pt-BR")
    setLog(prev => [{ msg, tipo, hora }, ...prev].slice(0, 20))
  }

  async function conectar() {
    if (!(navigator as any).bluetooth) {
      adicionarLog("Bluetooth não suportado. Use Chrome ou Edge.", "erro")
      return
    }
    try {
      setStatus("buscando")
      adicionarLog("Buscando SOS_DEVICE...")

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ name: "SOS_DEVICE" }],
        optionalServices: [SERVICE_UUID]
      })

      adicionarLog("Dispositivo encontrado: " + device.name)
      deviceRef.current = device

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("desconectado")
        adicionarLog("Dispositivo desconectado.", "aviso")
      })

      const server = await device.gatt.connect()
      adicionarLog("Conectado ao servidor GATT!")

      const service = await server.getPrimaryService(SERVICE_UUID)
      adicionarLog("Serviço encontrado!")

      const sosChar = await service.getCharacteristic(CHAR_SOS_UUID)
      adicionarLog("Característica encontrada, iniciando notificações...", "info")

      try {
        await sosChar.startNotifications()
        adicionarLog("Notificações ativas — aguardando SOS...", "sucesso")
      } catch (err: any) {
        adicionarLog("Erro ao iniciar notificações: " + err.message, "erro")
      }

      sosChar.addEventListener("characteristicvaluechanged", async (event: any) => {
        const decoder = new TextDecoder()
        const value = decoder.decode(event.target.value)

        adicionarLog("Valor recebido: " + value, "info")

        if (value === "SOS_ATIVADO" || value.includes("SOS") || value.length > 3) {
          adicionarLog("🆘 BOTÃO SOS PRESSIONADO!", "erro")

          navigator.geolocation?.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords
              adicionarLog("GPS: " + latitude.toFixed(4) + ", " + longitude.toFixed(4), "sucesso")
              try {
                const { addDoc, collection } = await import("firebase/firestore")
                await addDoc(collection(db, "alertas_sos"), {
                  usuario_id: usuario?.uid || "anonimo",
                  origem: "dispositivo_echo",
                  latitude,
                  longitude,
                  ativo: true,
                  mensagem: "Botão SOS do Artemis Echo foi acionado!",
                  criado_em: new Date().toISOString()
                })
                adicionarLog("✓ Alerta salvo no Firebase!", "sucesso")
              } catch (err: any) {
                adicionarLog("Erro Firebase: " + err.message, "erro")
              }
            },
            () => {
              adicionarLog("GPS negado, salvando sem localização...", "aviso")
              import("firebase/firestore").then(({ addDoc, collection }) => {
                addDoc(collection(db, "alertas_sos"), {
                  usuario_id: usuario?.uid || "anonimo",
                  origem: "dispositivo_echo",
                  ativo: true,
                  mensagem: "Botão SOS do Artemis Echo foi acionado!",
                  criado_em: new Date().toISOString()
                })
                  .then(() => adicionarLog("✓ Alerta salvo sem GPS!", "sucesso"))
                  .catch((e: any) => adicionarLog("Erro: " + e.message, "erro"))
              })
            }
          )
        }
      })

      cmdCharRef.current = sosChar
      setStatus("conectado")
      adicionarLog("✓ Artemis Echo conectado com sucesso!", "sucesso")

    } catch (err: any) {
      setStatus("desconectado")
      if (err.name === "NotFoundError") {
        adicionarLog("Nenhum dispositivo selecionado.", "aviso")
      } else {
        adicionarLog("Erro: " + err.message, "erro")
      }
    }
  }

  async function desconectar() {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect()
    }
    setStatus("desconectado")
    cmdCharRef.current = null
    adicionarLog("Desconectado manualmente.")
  }

  async function enviarComando(cmd: string) {
    if (!cmdCharRef.current) {
      adicionarLog("Dispositivo não conectado.", "erro")
      return
    }
    try {
      const encoder = new TextEncoder()
      await cmdCharRef.current.writeValue(encoder.encode(cmd))
      adicionarLog("Comando enviado: " + cmd, "sucesso")
    } catch (err: any) {
      adicionarLog("Erro ao enviar comando: " + err.message, "erro")
    }
  }

  const statusInfo: any = {
    desconectado: { cor: "#aaa", texto: "Desconectado", icon: BluetoothOff },
    buscando: { cor: cores.amarelo, texto: "Buscando dispositivo...", icon: BluetoothSearching },
    conectado: { cor: "#22c55e", texto: "Artemis Echo conectado", icon: Bluetooth },
  }

  const info = statusInfo[status]

  return (
    <div style={{ fontFamily: "sans-serif", backgroundColor: cores.fundo, minHeight: "100vh" }}>
      <Header />
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px 100px" }}>

        <h2 style={{ fontSize: "22px", marginBottom: "4px", color: cores.roxoEscuro }}>
          Dispositivo Echo
        </h2>
        <p style={{ color: cores.lavanda, marginBottom: "24px", fontSize: "14px" }}>
          Conecte seu dispositivo Artemis Echo via Bluetooth
        </p>

        {!suportaBLE && (
          <div style={{
            backgroundColor: "rgba(239,68,68,0.1)", borderRadius: "14px",
            padding: "14px 16px", marginBottom: "16px",
            border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", gap: "10px"
          }}>
            <XCircle size={20} color="#ef4444" />
            <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>
              Seu navegador não suporta Web Bluetooth. Use Chrome ou Edge.
            </p>
          </div>
        )}

        {/* Card status */}
        <div style={{
          backgroundColor: cores.branco, borderRadius: "20px",
          padding: "24px", marginBottom: "16px",
          boxShadow: "0 2px 12px rgba(90,73,151,0.1)", textAlign: "center"
        }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            backgroundColor: status === "conectado" ? "rgba(34,197,94,0.1)" : status === "buscando" ? "rgba(253,234,114,0.3)" : cores.fundo,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            animation: status === "buscando" ? "pulse 1.5s ease-in-out infinite" : "none"
          }}>
            <info.icon size={36} color={info.cor} />
          </div>

          <p style={{ color: cores.roxoEscuro, fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>
            {info.texto}
          </p>

          <div style={{ marginTop: "20px" }}>
            {status === "desconectado" && (
              <button onClick={conectar} disabled={!suportaBLE} style={{
                width: "100%", padding: "14px",
                backgroundColor: suportaBLE ? cores.roxo : "#ccc",
                color: cores.branco, border: "none", borderRadius: "12px",
                fontSize: "15px", fontWeight: "600",
                cursor: suportaBLE ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}>
                <Bluetooth size={18} /> Conectar Artemis Echo
              </button>
            )}

            {status === "buscando" && (
              <button disabled style={{
                width: "100%", padding: "14px",
                backgroundColor: "#e5e7eb", color: "#999",
                border: "none", borderRadius: "12px",
                fontSize: "15px", fontWeight: "600", cursor: "not-allowed"
              }}>
                Buscando...
              </button>
            )}

            {status === "conectado" && (
              <button onClick={desconectar} style={{
                width: "100%", padding: "14px",
                backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626",
                border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px",
                fontSize: "15px", fontWeight: "600", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}>
                <BluetoothOff size={18} /> Desconectar
              </button>
            )}
          </div>
        </div>

        {/* Comandos */}
        {status === "conectado" && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Comandos
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { cmd: "SIRENE_ON", icon: Volume2, label: "Ativar sirene", cor: cores.roxo },
                { cmd: "SIRENE_OFF", icon: Volume2, label: "Desativar sirene", cor: cores.lavanda },
                { cmd: "SOS_ATIVADO", icon: AlertCircle, label: "Testar SOS", cor: "#ef4444" },
                { cmd: "STATUS", icon: Shield, label: "Verificar status", cor: "#16a34a" },
              ].map((item) => (
                <button key={item.cmd} onClick={() => enviarComando(item.cmd)} style={{
                  backgroundColor: cores.branco, borderRadius: "14px",
                  padding: "14px", border: "1px solid rgba(90,73,151,0.15)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                  cursor: "pointer", boxShadow: "0 1px 4px rgba(90,73,151,0.06)"
                }}>
                  <item.icon size={22} color={item.cor} />
                  <span style={{ fontSize: "12px", fontWeight: "600", color: cores.roxoEscuro }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Log */}
        {log.length > 0 && (
          <div>
            <p style={{ fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Log de eventos
            </p>
            <div style={{
              backgroundColor: cores.branco, borderRadius: "14px",
              padding: "12px", boxShadow: "0 1px 4px rgba(90,73,151,0.06)",
              maxHeight: "250px", overflowY: "auto"
            }}>
              {log.map((entry, i) => (
                <div key={i} style={{
                  display: "flex", gap: "8px", alignItems: "flex-start",
                  padding: "6px 0",
                  borderBottom: i < log.length - 1 ? `1px solid ${cores.fundo}` : "none"
                }}>
                  {entry.tipo === "sucesso" && <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />}
                  {entry.tipo === "erro" && <XCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />}
                  {entry.tipo === "aviso" && <AlertCircle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: "2px" }} />}
                  {entry.tipo === "info" && <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: cores.lavanda, flexShrink: 0, marginTop: "2px" }} />}
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: cores.roxoEscuro }}>{entry.msg}</p>
                    <p style={{ margin: 0, fontSize: "10px", color: "#bbb" }}>{entry.hora}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Como conectar */}
        <div style={{
          backgroundColor: "rgba(90,73,151,0.06)", borderRadius: "14px",
          padding: "14px 16px", marginTop: "16px",
          border: "1px solid rgba(90,73,151,0.1)"
        }}>
          <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "700", color: cores.roxoEscuro }}>
            Como conectar
          </p>
          {[
            "Ligue o dispositivo Artemis Echo",
            "Certifique-se que o Bluetooth está ativado",
            "Use Chrome ou Edge",
            "Clique em 'Conectar Artemis Echo' e selecione o dispositivo",
            "Aperte o botão para acionar o SOS",
          ].map((passo, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "flex-start" }}>
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%",
                backgroundColor: cores.roxo, color: "white",
                fontSize: "10px", fontWeight: "700",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginTop: "1px"
              }}>
                {i + 1}
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: cores.lavanda, lineHeight: "1.5" }}>{passo}</p>
            </div>
          ))}
        </div>
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
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
              textDecoration: "none", color: ativo ? cores.roxo : "#aaa",
            }}>
              <div style={{ padding: "6px 16px", borderRadius: "12px", backgroundColor: ativo ? `rgba(90,73,151,0.1)` : "transparent" }}>
                <item.icon size={20} />
              </div>
              <span style={{ fontSize: "10px", fontWeight: ativo ? "600" : "400" }}>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}