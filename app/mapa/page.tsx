"use client"

import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  query,
  where,
  addDoc,
  updateDoc
} from "firebase/firestore"
import {
  MapPin,
  Navigation,
  AlertCircle,
  Users,
  MessageSquare,
  Home,
  Bell,
  Layers,
  Check,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Header from "../componentes/Header"
import dynamic from "next/dynamic"

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

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false
})

export default function Mapa() {
  const [localizacoes, setLocalizacoes] = useState<any[]>([])
  const [minhaPos, setMinhaPos] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const [status, setStatus] = useState("Obtendo localização...")
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  const [grupos, setGrupos] = useState<any[]>([])
  const [gruposSelecionados, setGruposSelecionados] =
    useState<Set<string>>(new Set())

  const [modalGrupos, setModalGrupos] = useState(false)

  // =========================
  // ESTADOS DO SOS
  // =========================

  const [sosAtivo, setSosAtivo] = useState(false)
  const [popupSOS, setPopupSOS] = useState(false)
  const [enviandoSOS, setEnviandoSOS] = useState(false)
  const [alertaEnviado, setAlertaEnviado] = useState(false)
  const [idAlertaSOS, setIdAlertaSOS] = useState<string | null>(null)
  const [tempoRestante, setTempoRestante] = useState(0)

  const pathname = usePathname()

  // =========================
  // AUTENTICAÇÃO
  // =========================

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuarioId(user.uid)
      }
    })

    return () => unsub()
  }, [])

  // =========================
  // GRUPOS
  // =========================

  useEffect(() => {
    if (!usuarioId) return

    const q = query(
      collection(db, "grupos"),
      where("membros", "array-contains", usuarioId)
    )

    const unsub = onSnapshot(q, (snap) => {
      const dados = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }))

      setGrupos(dados)

      setGruposSelecionados(
        new Set(dados.map((g: any) => g.id))
      )
    })

    return () => unsub()
  }, [usuarioId])

  // =========================
  // LOCALIZAÇÃO
  // =========================

  useEffect(() => {
    if (!usuarioId) return

    if (!navigator.geolocation) {
      setStatus("GPS não disponível")
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

        setMinhaPos({
          lat: latitude,
          lng: longitude
        })

        setStatus("Localização em tempo real ativa")

        await setDoc(
          doc(db, "localizacoes", usuarioId),
          {
            usuario_id: usuarioId,
            latitude,
            longitude,
            atualizado_em: new Date().toISOString()
          }
        )
      },
      () => setStatus("Permissão de localização negada"),
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    )

    return () =>
      navigator.geolocation.clearWatch(watchId)
  }, [usuarioId])

  // =========================
  // LOCALIZAÇÕES DOS GRUPOS
  // =========================

  useEffect(() => {
    if (!usuarioId || grupos.length === 0) {
      setLocalizacoes([])
      return
    }

    const idsParaMostrar = new Set<string>()

    grupos.forEach((grupo) => {
      if (gruposSelecionados.has(grupo.id)) {
        ;(grupo.membros || []).forEach((uid: string) => {
          if (uid !== usuarioId) {
            idsParaMostrar.add(uid)
          }
        })
      }
    })

    if (idsParaMostrar.size === 0) {
      setLocalizacoes([])
      return
    }

    const q = query(
      collection(db, "localizacoes"),
      where("usuario_id", "in", [...idsParaMostrar])
    )

    const unsub = onSnapshot(q, (snap) => {
      const locs = snap.docs.map((d) => {
        const data = {
          id: d.id,
          ...d.data()
        } as any

        const grupoDoMembro = grupos.find(
          (g) =>
            gruposSelecionados.has(g.id) &&
            (g.membros || []).includes(data.usuario_id)
        )

        data.corGrupo =
          grupoDoMembro?.cor || cores.roxoClaro

        data.nomeGrupo =
          grupoDoMembro?.nome || ""

        return data
      })

      setLocalizacoes(locs)
    })

    return () => unsub()
  }, [
    usuarioId,
    grupos,
    gruposSelecionados
  ])

  // =========================
  // MONITORAR SOS NO FIREBASE
  // =========================

  useEffect(() => {
    if (!usuarioId) return

    const q = query(
      collection(db, "alertas_sos"),
      where("usuario_id", "==", usuarioId)
    )

    const unsub = onSnapshot(q, (snap) => {
      const alertas = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data()
        }))
        .filter((alerta: any) => alerta.ativo === true)
        .sort((a: any, b: any) => {
          return (
            new Date(b.criado_em).getTime() -
            new Date(a.criado_em).getTime()
          )
        })

      const alerta = alertas[0]

      if (!alerta) {
        setSosAtivo(false)
        setEnviandoSOS(false)
        setAlertaEnviado(false)
        setIdAlertaSOS(null)
        setTempoRestante(0)
        return
      }

      setSosAtivo(true)
      setAlertaEnviado(true)
      setEnviandoSOS(false)
      setIdAlertaSOS(alerta.id)

      const inicio = new Date(
        alerta.criado_em
      ).getTime()

      const agora = Date.now()

      const duracao = 2 * 60 * 1000

      const restante =
        duracao - (agora - inicio)

      if (restante <= 0) {
        updateDoc(
          doc(db, "alertas_sos", alerta.id),
          {
            ativo: false,
            encerrado_em:
              new Date().toISOString()
          }
        ).catch(() => {})

        return
      }

      setTempoRestante(restante)
    })

    return () => unsub()
  }, [usuarioId])

  // =========================
  // CONTADOR DOS 2 MINUTOS
  // =========================

  useEffect(() => {
    if (!sosAtivo || !idAlertaSOS) return

    const intervalo = setInterval(() => {
      setTempoRestante((anterior) => {
        const novoTempo = anterior - 1000

        if (novoTempo <= 0) {
          clearInterval(intervalo)

          updateDoc(
            doc(db, "alertas_sos", idAlertaSOS),
            {
              ativo: false,
              encerrado_em:
                new Date().toISOString()
            }
          ).catch(() => {})

          setSosAtivo(false)
          setAlertaEnviado(false)
          setIdAlertaSOS(null)

          return 0
        }

        return novoTempo
      })
    }, 1000)

    return () => clearInterval(intervalo)
  }, [sosAtivo, idAlertaSOS])

  // =========================
  // ATIVAR SOS
  // =========================

  async function ativarSOS() {
    if (!usuarioId || sosAtivo || enviandoSOS) {
      return
    }

    setEnviandoSOS(true)
    setPopupSOS(true)
    setAlertaEnviado(false)

    try {
      const criarAlerta = async (
        latitude?: number,
        longitude?: number
      ) => {
        const alertaRef = await addDoc(
          collection(db, "alertas_sos"),
          {
            usuario_id: usuarioId,
            origem: "mapa",
            latitude: latitude || null,
            longitude: longitude || null,
            ativo: true,
            criado_em:
              new Date().toISOString()
          }
        )

        setIdAlertaSOS(alertaRef.id)
        setSosAtivo(true)
        setEnviandoSOS(false)
        setAlertaEnviado(true)
        setTempoRestante(2 * 60 * 1000)

        // Salva também no navegador.
        // Assim conseguimos reconhecer o SOS
        // quando o usuário voltar para a página.
        localStorage.setItem(
          "sos_ativo",
          JSON.stringify({
            id: alertaRef.id,
            criado_em:
              new Date().toISOString()
          })
        )
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await criarAlerta(
              pos.coords.latitude,
              pos.coords.longitude
            )
          },
          async () => {
            await criarAlerta()
          },
          {
            enableHighAccuracy: true,
            timeout: 10000
          }
        )
      } else {
        await criarAlerta()
      }

    } catch (error) {
      console.error(
        "Erro ao ativar SOS:",
        error
      )

      setEnviandoSOS(false)
      setSosAtivo(false)
      setAlertaEnviado(false)

      alert(
        "Não foi possível enviar o alerta SOS."
      )
    }
  }

  // =========================
  // CANCELAR SOS
  // =========================

  async function cancelarSOS() {
    if (!idAlertaSOS) {
      setSosAtivo(false)
      setAlertaEnviado(false)
      setPopupSOS(false)

      localStorage.removeItem("sos_ativo")

      return
    }

    try {
      await updateDoc(
        doc(
          db,
          "alertas_sos",
          idAlertaSOS
        ),
        {
          ativo: false,
          cancelado_em:
            new Date().toISOString()
        }
      )

      setSosAtivo(false)
      setAlertaEnviado(false)
      setEnviandoSOS(false)
      setIdAlertaSOS(null)
      setTempoRestante(0)
      setPopupSOS(false)

      localStorage.removeItem("sos_ativo")

    } catch (error) {
      console.error(
        "Erro ao cancelar SOS:",
        error
      )

      alert(
        "Não foi possível cancelar o SOS."
      )
    }
  }

  // =========================
  // FECHAR POPUP
  // =========================

  function fecharPopupSOS() {
    // IMPORTANTE:
    // apenas fecha o popup.
    // O SOS continua ativo.
    setPopupSOS(false)
  }

  // =========================
  // GRUPOS
  // =========================

  function toggleGrupo(grupoId: string) {
    setGruposSelecionados((prev) => {
      const novo = new Set(prev)

      if (novo.has(grupoId)) {
        novo.delete(grupoId)
      } else {
        novo.add(grupoId)
      }

      return novo
    })
  }

  function toggleTodos() {
    if (
      gruposSelecionados.size ===
      grupos.length
    ) {
      setGruposSelecionados(new Set())
    } else {
      setGruposSelecionados(
        new Set(
          grupos.map((g) => g.id)
        )
      )
    }
  }

  // =========================
  // TEMPO FORMATADO
  // =========================

  function formatarTempo() {
    const segundos = Math.ceil(
      tempoRestante / 1000
    )

    const minutos = Math.floor(
      segundos / 60
    )

    const segundosRestantes =
      segundos % 60

    return `${minutos}:${String(
      segundosRestantes
    ).padStart(2, "0")}`
  }

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        backgroundColor: cores.fundo,
        minHeight: "100vh"
      }}
    >

      <Header />

      {/* STATUS DA LOCALIZAÇÃO */}

      <div
        style={{
          backgroundColor: cores.branco,
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          margin: "0 16px",
          borderRadius:
            "0 0 12px 12px",
          boxShadow:
            "0 2px 8px rgba(90,73,151,0.06)"
        }}
      >

        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor:
              status.includes("ativa")
                ? "#22c55e"
                : "#f97316"
          }}
        />

        <span
          style={{
            fontSize: "13px",
            color: "#666"
          }}
        >
          {status}
        </span>

        {localizacoes.length > 0 && (
          <span
            style={{
              fontSize: "12px",
              color: cores.roxo,
              marginLeft: "auto"
            }}
          >
            {localizacoes.length} pessoa
            {localizacoes.length > 1
              ? "s"
              : ""} visível
            {localizacoes.length > 1
              ? "is"
              : ""}
          </span>
        )}

      </div>

      {/* MAPA */}

      <div
        style={{
          width: "100%",
          height:
            "calc(100vh - 170px)"
        }}
      >
        <MapaLeaflet
          minhaPos={minhaPos}
          localizacoes={localizacoes}
        />
      </div>

      {/* CENTRALIZAR */}

      <div
        style={{
          position: "fixed",
          bottom: "90px",
          left: "24px",
          zIndex: 50
        }}
      >
        <button
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor:
              cores.branco,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.15)"
          }}
        >
          <Navigation
            size={20}
            color={cores.roxo}
          />
        </button>
      </div>

      {/* GRUPOS */}

      <div
        style={{
          position: "fixed",
          bottom: "148px",
          right: "24px",
          zIndex: 50
        }}
      >
        <button
          onClick={() =>
            setModalGrupos(true)
          }
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor:
              cores.branco,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.15)",
            position: "relative"
          }}
        >
          <Layers
            size={20}
            color={cores.roxo}
          />

          {gruposSelecionados.size > 0 && (
            <div
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor:
                  cores.roxo,
                color: "white",
                fontSize: "10px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {gruposSelecionados.size}
            </div>
          )}
        </button>
      </div>

      {/* =========================
          BOTÃO SOS
      ========================= */}

      <div
        style={{
          position: "fixed",
          bottom: "90px",
          right: "24px",
          zIndex: 100
        }}
      >

        <button
          onClick={() => {
            if (!sosAtivo) {
              ativarSOS()
            } else {
              setPopupSOS(true)
            }
          }}
          style={{
            width: sosAtivo
              ? "64px"
              : "56px",
            height: sosAtivo
              ? "64px"
              : "56px",
            borderRadius: "50%",
            backgroundColor:
              "#ef4444",
            border:
              "4px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow:
              "0 4px 20px rgba(239,68,68,0.3)",
            animation: sosAtivo
              ? "sos-map-pulse 1s ease-in-out infinite"
              : "none",
            transition:
              "all 0.2s"
          }}
        >
          <AlertCircle
            size={sosAtivo ? 28 : 24}
            color={cores.branco}
          />
        </button>

      </div>

      {/* =========================
          POPUP DO SOS
      ========================= */}

      {popupSOS && (
        <>

          {/* Fundo escuro */}

          <div
            onClick={fecharPopupSOS}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor:
                "rgba(0,0,0,0.35)",
              zIndex: 500
            }}
          />

          {/* POPUP */}

          <div
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform:
                "translate(-50%, -50%)",
              width:
                "calc(100% - 40px)",
              maxWidth: "380px",
              backgroundColor:
                cores.branco,
              borderRadius: "24px",
              padding: "24px",
              zIndex: 501,
              boxShadow:
                "0 10px 40px rgba(0,0,0,0.2)",
              boxSizing: "border-box"
            }}
          >

            {/* X */}

            <button
              onClick={fecharPopupSOS}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                backgroundColor:
                  cores.fundo,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <X
                size={18}
                color={
                  cores.lavanda
                }
              />
            </button>

            {/* ÍCONE SOS */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "center",
                marginBottom: "14px"
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor:
                    "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation:
                    sosAtivo
                      ? "sos-popup-pulse 1s ease-in-out infinite"
                      : "none"
                }}
              >
                <AlertCircle
                  size={42}
                  color="white"
                />
              </div>
            </div>

            {/* TÍTULO */}

            <h2
              style={{
                margin: 0,
                textAlign: "center",
                color:
                  cores.roxoEscuro,
                fontSize: "20px",
                fontWeight: "800"
              }}
            >
              {enviandoSOS
                ? "Enviando alerta..."
                : "Alerta SOS ativo"}
            </h2>

            {/* MENSAGEM */}

            <p
              style={{
                textAlign: "center",
                color:
                  cores.lavanda,
                fontSize: "13px",
                lineHeight: "1.5",
                margin:
                  "8px 0 20px"
              }}
            >
              {enviandoSOS
                ? "Enviando alerta para seus contatos..."
                : "Seus contatos de confiança foram notificados."}
            </p>

            {/* STATUS */}

            <div
              style={{
                backgroundColor:
                  cores.fundo,
                borderRadius: "16px",
                padding: "16px"
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "12px"
                }}
              >
                <span
                  style={{
                    color:
                      cores.lavanda,
                    fontSize: "13px"
                  }}
                >
                  Alerta
                </span>

                <span
                  style={{
                    color:
                      enviandoSOS
                        ? "#f97316"
                        : "#16a34a",
                    fontSize: "13px",
                    fontWeight: "700"
                  }}
                >
                  {enviandoSOS
                    ? "Enviando..."
                    : "✓ Enviado"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "12px"
                }}
              >
                <span
                  style={{
                    color:
                      cores.lavanda,
                    fontSize: "13px"
                  }}
                >
                  Localização
                </span>

                <span
                  style={{
                    color: "#16a34a",
                    fontSize: "13px",
                    fontWeight: "700"
                  }}
                >
                  ✓ Compartilhada
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between"
                }}
              >
                <span
                  style={{
                    color:
                      cores.lavanda,
                    fontSize: "13px"
                  }}
                >
                  Contatos
                </span>

                <span
                  style={{
                    color:
                      enviandoSOS
                        ? "#f97316"
                        : "#16a34a",
                    fontSize: "13px",
                    fontWeight: "700"
                  }}
                >
                  {enviandoSOS
                    ? "Enviando..."
                    : "✓ Notificados"}
                </span>
              </div>

            </div>

            {/* TEMPO */}

            {sosAtivo &&
              !enviandoSOS && (
                <div
                  style={{
                    textAlign:
                      "center",
                    marginTop: "18px"
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color:
                        cores.lavanda,
                      fontSize: "12px"
                    }}
                  >
                    Alerta ativo por mais
                  </p>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop: "3px",
                      color:
                        cores.roxoEscuro,
                      fontSize: "20px"
                    }}
                  >
                    {formatarTempo()}
                  </strong>
                </div>
              )}

            {/* CANCELAR */}

            {sosAtivo &&
              !enviandoSOS && (
                <button
                  onClick={cancelarSOS}
                  style={{
                    width: "100%",
                    marginTop: "18px",
                    padding: "13px",
                    borderRadius: "14px",
                    backgroundColor:
                      "rgba(239,68,68,0.08)",
                    color:
                      "#dc2626",
                    border:
                      "1.5px solid #dc2626",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "700"
                  }}
                >
                  Cancelar SOS
                </button>
              )}

          </div>
        </>
      )}

      {/* =========================
          MODAL GRUPOS
      ========================= */}

      {modalGrupos && (
        <>

          <div
            onClick={() =>
              setModalGrupos(false)
            }
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor:
                "rgba(0,0,0,0.3)",
              zIndex: 200
            }}
          />

          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor:
                cores.branco,
              borderRadius:
                "24px 24px 0 0",
              padding: "24px",
              zIndex: 300,
              boxShadow:
                "0 -4px 24px rgba(90,73,151,0.15)"
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: "20px"
              }}
            >

              <div>
                <h3
                  style={{
                    color:
                      cores.roxoEscuro,
                    margin: 0,
                    fontSize: "17px"
                  }}
                >
                  Grupos no mapa
                </h3>

                <p
                  style={{
                    color:
                      cores.lavanda,
                    margin:
                      "4px 0 0",
                    fontSize: "12px"
                  }}
                >
                  Selecione quais grupos visualizar
                </p>
              </div>

              <button
                onClick={() =>
                  setModalGrupos(false)
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <X
                  size={20}
                  color={
                    cores.lavanda
                  }
                />
              </button>

            </div>

            {grupos.length > 1 && (
              <button
                onClick={toggleTodos}
                style={{
                  width: "100%",
                  padding:
                    "12px 16px",
                  borderRadius: "12px",
                  backgroundColor:
                    cores.fundo,
                  border: "none",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  cursor: "pointer",
                  marginBottom:
                    "12px"
                }}
              >

                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color:
                      cores.roxoEscuro
                  }}
                >
                  {gruposSelecionados.size ===
                  grupos.length
                    ? "Desmarcar todos"
                    : "Selecionar todos"}
                </span>

                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    backgroundColor:
                      gruposSelecionados.size ===
                      grupos.length
                        ? cores.roxo
                        : "transparent",
                    border:
                      `2px solid ${
                        gruposSelecionados.size ===
                        grupos.length
                          ? cores.roxo
                          : "#ddd"
                      }`,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center"
                  }}
                >
                  {gruposSelecionados.size ===
                    grupos.length && (
                    <Check
                      size={12}
                      color="white"
                    />
                  )}
                </div>

              </button>
            )}

            {grupos.length === 0 ? (
              <p
                style={{
                  color:
                    cores.lavanda,
                  fontSize: "14px",
                  textAlign:
                    "center"
                }}
              >
                Nenhum grupo criado ainda.
              </p>
            ) : (
              grupos.map((grupo) => {
                const ativo =
                  gruposSelecionados.has(
                    grupo.id
                  )

                return (
                  <button
                    key={grupo.id}
                    onClick={() =>
                      toggleGrupo(
                        grupo.id
                      )
                    }
                    style={{
                      width: "100%",
                      padding:
                        "14px 16px",
                      borderRadius:
                        "14px",
                      border:
                        `1.5px solid ${
                          ativo
                            ? grupo.cor
                            : "rgba(90,73,151,0.1)"
                        }`,
                      backgroundColor:
                        ativo
                          ? `${grupo.cor}12`
                          : cores.branco,
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "12px",
                      cursor:
                        "pointer",
                      marginBottom:
                        "8px"
                    }}
                  >

                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius:
                          "10px",
                        backgroundColor:
                          grupo.cor ||
                          cores.roxo,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        flexShrink: 0
                      }}
                    >
                      <Users
                        size={18}
                        color="white"
                      />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        textAlign:
                          "left"
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "14px",
                          fontWeight:
                            "600",
                          color:
                            cores.roxoEscuro
                        }}
                      >
                        {grupo.nome}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "12px",
                          color:
                            cores.lavanda
                        }}
                      >
                        {(grupo.membros?.length ||
                          1) - 1}{" "}
                        membro
                        {((grupo.membros?.length ||
                          1) - 1) !==
                        1
                          ? "s"
                          : ""}{" "}
                        além de você
                      </p>
                    </div>

                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius:
                          "6px",
                        backgroundColor:
                          ativo
                            ? grupo.cor
                            : "transparent",
                        border:
                          `2px solid ${
                            ativo
                              ? grupo.cor
                              : "#ddd"
                          }`,
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        flexShrink: 0
                      }}
                    >
                      {ativo && (
                        <Check
                          size={13}
                          color="white"
                        />
                      )}
                    </div>

                  </button>
                )
              })
            )}

            <button
              onClick={() =>
                setModalGrupos(false)
              }
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "14px",
                backgroundColor:
                  cores.roxo,
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Ver no mapa
            </button>

          </div>
        </>
      )}

      {/* =========================
          NAVBAR
      ========================= */}

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor:
            cores.branco,
          borderTop:
            `1px solid ${cores.fundo}`,
          display: "flex",
          justifyContent:
            "space-around",
          padding: "10px 0",
          boxShadow:
            "0 -2px 12px rgba(90,73,151,0.08)",
          zIndex: 1000
        }}
      >

        {nav.map((item) => {
          const ativo =
            pathname === item.href

          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                gap: "4px",
                textDecoration:
                  "none",
                color:
                  ativo
                    ? cores.roxo
                    : "#aaa"
              }}
            >

              <div
                style={{
                  padding:
                    "6px 16px",
                  borderRadius:
                    "12px",
                  backgroundColor:
                    ativo
                      ? "rgba(90,73,151,0.1)"
                      : "transparent"
                }}
              >
                <item.icon
                  size={20}
                />
              </div>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight:
                    ativo
                      ? "600"
                      : "400"
                }}
              >
                {item.label}
              </span>

            </Link>
          )
        })}

      </div>

      {/* =========================
          ANIMAÇÕES
      ========================= */}

      <style>{`

        @keyframes sos-map-pulse {

          0%, 100% {
            transform: scale(1);
            box-shadow:
              0 4px 20px
              rgba(239,68,68,0.35);
            opacity: 1;
          }

          50% {
            transform: scale(1.12);
            box-shadow:
              0 4px 32px
              rgba(239,68,68,0.9);
            opacity: 0.6;
          }

        }

        @keyframes sos-popup-pulse {

          0%, 100% {
            transform: scale(1);
            opacity: 1;
            box-shadow:
              0 5px 20px
              rgba(239,68,68,0.35);
          }

          50% {
            transform: scale(1.06);
            opacity: 0.6;
            box-shadow:
              0 5px 30px
              rgba(239,68,68,0.8);
          }

        }

      `}</style>

    </div>
  )
}