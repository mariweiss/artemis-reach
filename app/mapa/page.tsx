"use client"

import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDoc
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
  X,
  Phone,
  Clock
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

/* =========================================================
   MAPA LEAFLET
========================================================= */

const MapaLeaflet = dynamic(
  () => import("./MapaLeaflet"),
  { ssr: false }
)

/* =========================================================
   TIPOS
========================================================= */

interface AlertaSOS {
  id: string
  usuario_id: string
  origem?: string
  latitude?: number
  longitude?: number
  ativo?: boolean
  mensagem?: string
  modo_silencioso?: boolean
  criado_em: string
  cancelado_em?: string
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function Mapa() {
  const pathname = usePathname()

  /* =======================================================
     MAPA / LOCALIZAÇÃO
  ======================================================= */

  const [localizacoes, setLocalizacoes] = useState<any[]>([])
  const [minhaPos, setMinhaPos] = useState<{
    lat: number
    lng: number
  } | null>(null)

  const [status, setStatus] = useState(
    "Obtendo localização..."
  )

  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  /* =======================================================
     GRUPOS
  ======================================================= */

  const [grupos, setGrupos] = useState<any[]>([])
  const [gruposSelecionados, setGruposSelecionados] =
    useState<Set<string>>(new Set())

  const [modalGrupos, setModalGrupos] =
    useState(false)

  /* =======================================================
     SOS
  ======================================================= */

  const [alertaSOS, setAlertaSOS] =
    useState<AlertaSOS | null>(null)

  const [sosAtivo, setSosAtivo] =
    useState(false)

  const [popupSOS, setPopupSOS] =
    useState(false)

  const [tempoRestante, setTempoRestante] =
    useState(0)

  const [enviandoSOS, setEnviandoSOS] =
    useState(false)

  const [contatosNotificados, setContatosNotificados] =
    useState(false)

  /* =======================================================
     AUTENTICAÇÃO
  ======================================================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setUsuarioId(user.uid)
        }
      }
    )

    return () => unsub()
  }, [])

  /* =======================================================
     GRUPOS DO USUÁRIO
  ======================================================= */

  useEffect(() => {
    if (!usuarioId) return

    const q = query(
      collection(db, "grupos"),
      where(
        "membros",
        "array-contains",
        usuarioId
      )
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const dados = snap.docs.map(
          (d) => ({
            id: d.id,
            ...d.data()
          })
        )

        setGrupos(dados)

        setGruposSelecionados(
          new Set(
            dados.map(
              (g: any) => g.id
            )
          )
        )
      }
    )

    return () => unsub()
  }, [usuarioId])

  /* =======================================================
     LOCALIZAÇÃO DO USUÁRIO
  ======================================================= */

  useEffect(() => {
    if (!usuarioId) return

    if (!navigator.geolocation) {
      setStatus("GPS não disponível")
      return
    }

    const watchId =
      navigator.geolocation.watchPosition(
        async (pos) => {
          const {
            latitude,
            longitude
          } = pos.coords

          setMinhaPos({
            lat: latitude,
            lng: longitude
          })

          setStatus(
            "Localização em tempo real ativa"
          )

          try {
            await setDoc(
              doc(
                db,
                "localizacoes",
                usuarioId
              ),
              {
                usuario_id: usuarioId,
                latitude,
                longitude,
                atualizado_em:
                  new Date().toISOString()
              }
            )
          } catch (error) {
            console.error(
              "Erro ao atualizar localização:",
              error
            )
          }
        },
        () => {
          setStatus(
            "Permissão de localização negada"
          )
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      )

    return () =>
      navigator.geolocation.clearWatch(
        watchId
      )
  }, [usuarioId])

  /* =======================================================
     LOCALIZAÇÕES DOS MEMBROS DOS GRUPOS
  ======================================================= */

  useEffect(() => {
    if (
      !usuarioId ||
      grupos.length === 0
    ) {
      setLocalizacoes([])
      return
    }

    const idsParaMostrar =
      new Set<string>()

    grupos.forEach((grupo) => {
      if (
        gruposSelecionados.has(
          grupo.id
        )
      ) {
        ;(
          grupo.membros || []
        ).forEach(
          (uid: string) => {
            if (uid !== usuarioId) {
              idsParaMostrar.add(uid)
            }
          }
        )
      }
    })

    if (
      idsParaMostrar.size === 0
    ) {
      setLocalizacoes([])
      return
    }

    const q = query(
      collection(
        db,
        "localizacoes"
      ),
      where(
        "usuario_id",
        "in",
        [...idsParaMostrar]
      )
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const locs =
          snap.docs.map(
            (d) => {
              const data = {
                id: d.id,
                ...d.data()
              } as any

              const grupoDoMembro =
                grupos.find(
                  (g) =>
                    gruposSelecionados.has(
                      g.id
                    ) &&
                    (
                      g.membros || []
                    ).includes(
                      data.usuario_id
                    )
                )

              data.corGrupo =
                grupoDoMembro?.cor ||
                cores.roxoClaro

              data.nomeGrupo =
                grupoDoMembro?.nome ||
                ""

              return data
            }
          )

        setLocalizacoes(locs)
      }
    )

    return () => unsub()
  }, [
    usuarioId,
    grupos,
    gruposSelecionados
  ])

  /* =======================================================
     ESCUTA SOS ATIVO NO FIREBASE
     
     Isso é o que faz o SOS continuar funcionando
     mesmo quando o usuário troca de página.
  ======================================================= */

  useEffect(() => {
    if (!usuarioId) return

    const q = query(
      collection(
        db,
        "alertas_sos"
      ),
      where(
        "usuario_id",
        "==",
        usuarioId
      )
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const alertas: AlertaSOS[] =
          snap.docs.map(
            (d) =>
              ({
                id: d.id,
                ...d.data()
              }) as AlertaSOS
          )

        const ativos =
          alertas
            .filter(
              (alerta) =>
                alerta.ativo === true &&
                !!alerta.criado_em
            )
            .sort(
              (a, b) =>
                new Date(
                  b.criado_em
                ).getTime() -
                new Date(
                  a.criado_em
                ).getTime()
            )

        if (ativos.length === 0) {
          setAlertaSOS(null)
          setSosAtivo(false)
          setTempoRestante(0)
          setContatosNotificados(false)
          return
        }

        const alerta = ativos[0]

        setAlertaSOS(alerta)
        setSosAtivo(true)

        /*
         * Verifica se o popup foi fechado anteriormente
         * para esse mesmo alerta.
         */
        const popupFechado =
          sessionStorage.getItem(
            `sos_popup_fechado_${alerta.id}`
          )

        if (
          popupFechado !== "true"
        ) {
          setPopupSOS(true)
        }

        /*
         * Como o alerta já foi salvo no Firebase,
         * consideramos que o envio foi confirmado.
         */
        setEnviandoSOS(false)
        setContatosNotificados(true)
      }
    )

    return () => unsub()
  }, [usuarioId])

  /* =======================================================
     CONTADOR DE 2 MINUTOS
     
     O tempo é calculado usando criado_em.
     Portanto, trocar de página não reinicia o contador.
  ======================================================= */

  useEffect(() => {
    if (
      !alertaSOS ||
      !alertaSOS.criado_em ||
      !sosAtivo
    ) {
      return
    }

    const atualizarTempo =
      async () => {
        const inicio =
          new Date(
            alertaSOS.criado_em
          ).getTime()

        const agora =
          Date.now()

        const duracao =
          2 * 60 * 1000

        const decorrido =
          agora - inicio

        const restante =
          Math.max(
            0,
            duracao - decorrido
          )

        setTempoRestante(
          restante
        )

        /*
         * Quando chegar a zero,
         * encerra o SOS no Firebase.
         */
        if (
          restante <= 0 &&
          alertaSOS.ativo
        ) {
          try {
            await updateDoc(
              doc(
                db,
                "alertas_sos",
                alertaSOS.id
              ),
              {
                ativo: false,
                encerrado_em:
                  new Date().toISOString()
              }
            )
          } catch (error) {
            console.error(
              "Erro ao encerrar SOS:",
              error
            )
          }
        }
      }

    atualizarTempo()

    const intervalo =
      setInterval(
        atualizarTempo,
        1000
      )

    return () =>
      clearInterval(
        intervalo
      )
  }, [
    alertaSOS,
    sosAtivo
  ])

  /* =======================================================
     ABRIR SOS
  ======================================================= */

  async function ativarSOS() {
    if (
      !usuarioId ||
      sosAtivo ||
      enviandoSOS
    ) {
      return
    }

    setEnviandoSOS(true)

    try {
      /*
       * Verifica configuração do SOS.
       */
      const perfilSnap =
        await getDoc(
          doc(
            db,
            "usuarios",
            usuarioId
          )
        )

      const sosAtivado =
        perfilSnap.data()
          ?.seguranca
          ?.sosAtivo !== false

      if (!sosAtivado) {
        alert(
          "O botão SOS está desativado nas configurações de segurança."
        )

        setEnviandoSOS(false)

        return
      }

      /*
       * Tenta pegar a localização.
       */
      const criarAlerta =
        async (
          latitude?: number,
          longitude?: number
        ) => {
          const alertaRef =
            await addDoc(
              collection(
                db,
                "alertas_sos"
              ),
              {
                usuario_id:
                  usuarioId,

                origem:
                  "mapa",

                latitude:
                  latitude ?? null,

                longitude:
                  longitude ?? null,

                ativo: true,

                mensagem:
                  "Alerta SOS ativado pelo mapa.",

                criado_em:
                  new Date().toISOString()
              }
            )

          /*
           * Cria imediatamente o estado visual.
           */
          const novoAlerta: AlertaSOS =
            {
              id: alertaRef.id,
              usuario_id:
                usuarioId,
              origem:
                "mapa",
              latitude,
              longitude,
              ativo: true,
              mensagem:
                "Alerta SOS ativado pelo mapa.",
              criado_em:
                new Date().toISOString()
            }

          setAlertaSOS(
            novoAlerta
          )

          setSosAtivo(true)

          setEnviandoSOS(false)

          setContatosNotificados(
            true
          )

          setPopupSOS(true)

          /*
           * Se for um novo alerta,
           * removemos a informação de popup fechado.
           */
          sessionStorage.removeItem(
            `sos_popup_fechado_${alertaRef.id}`
          )
        }

      if (
        navigator.geolocation
      ) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await criarAlerta(
                pos.coords.latitude,
                pos.coords.longitude
              )
            } catch (error) {
              console.error(
                "Erro ao criar SOS:",
                error
              )

              setEnviandoSOS(false)

              alert(
                "Não foi possível enviar o alerta SOS."
              )
            }
          },
          async () => {
            /*
             * Mesmo sem GPS, o SOS continua sendo enviado.
             */
            try {
              await criarAlerta()
            } catch (error) {
              console.error(
                "Erro ao criar SOS:",
                error
              )

              setEnviandoSOS(false)

              alert(
                "Não foi possível enviar o alerta SOS."
              )
            }
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

      alert(
        "Não foi possível enviar o alerta SOS. Tente novamente."
      )
    }
  }

  /* =======================================================
     CANCELAR SOS
  ======================================================= */

  async function cancelarSOS() {
    if (!alertaSOS) {
      setSosAtivo(false)
      setPopupSOS(false)
      return
    }

    try {
      await updateDoc(
        doc(
          db,
          "alertas_sos",
          alertaSOS.id
        ),
        {
          ativo: false,
          cancelado_em:
            new Date().toISOString()
        }
      )

      setSosAtivo(false)
      setPopupSOS(false)
      setAlertaSOS(null)
      setTempoRestante(0)
      setContatosNotificados(false)

    } catch (error) {
      console.error(
        "Erro ao cancelar SOS:",
        error
      )

      alert(
        "Não foi possível cancelar o SOS. Tente novamente."
      )
    }
  }

  /* =======================================================
     FECHAR POPUP
     
     IMPORTANTE:
     Fechar aqui NÃO cancela o SOS.
  ======================================================= */

  function fecharPopupSOS() {
    if (!alertaSOS) {
      setPopupSOS(false)
      return
    }

    sessionStorage.setItem(
      `sos_popup_fechado_${alertaSOS.id}`,
      "true"
    )

    setPopupSOS(false)
  }

  /* =======================================================
     GRUPOS
  ======================================================= */

  function toggleGrupo(
    grupoId: string
  ) {
    setGruposSelecionados(
      (prev) => {
        const novo =
          new Set(prev)

        if (
          novo.has(grupoId)
        ) {
          novo.delete(grupoId)
        } else {
          novo.add(grupoId)
        }

        return novo
      }
    )
  }

  function toggleTodos() {
    if (
      gruposSelecionados.size ===
      grupos.length
    ) {
      setGruposSelecionados(
        new Set()
      )
    } else {
      setGruposSelecionados(
        new Set(
          grupos.map(
            (g) => g.id
          )
        )
      )
    }
  }

  /* =======================================================
     FORMATAR TEMPO
  ======================================================= */

  function formatarTempo(
    milissegundos: number
  ) {
    const segundos =
      Math.ceil(
        milissegundos / 1000
      )

    const minutos =
      Math.floor(
        segundos / 60
      )

    const seg =
      segundos % 60

    return `${minutos}:${seg
      .toString()
      .padStart(2, "0")}`
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      style={{
        fontFamily:
          "sans-serif",
        backgroundColor:
          cores.fundo,
        minHeight:
          "100vh"
      }}
    >

      <Header />

      {/* =================================================
          STATUS DA LOCALIZAÇÃO
      ================================================= */}

      <div
        style={{
          backgroundColor:
            cores.branco,
          padding:
            "10px 20px",
          display:
            "flex",
          alignItems:
            "center",
          gap: "8px",
          margin:
            "0 16px",
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
            borderRadius:
              "50%",
            backgroundColor:
              status.includes(
                "ativa"
              )
                ? "#22c55e"
                : "#f97316"
          }}
        />

        <span
          style={{
            fontSize:
              "13px",
            color: "#666"
          }}
        >
          {status}
        </span>

        {localizacoes.length >
          0 && (
          <span
            style={{
              fontSize:
                "12px",
              color:
                cores.roxo,
              marginLeft:
                "auto"
            }}
          >
            {localizacoes.length}{" "}
            pessoa
            {localizacoes.length >
            1
              ? "s"
              : ""}{" "}
            visível
            {localizacoes.length >
            1
              ? "is"
              : ""}
          </span>
        )}
      </div>

      {/* =================================================
          MAPA
      ================================================= */}

      <div
        style={{
          width:
            "100%",
          height:
            "calc(100vh - 170px)"
        }}
      >
        <MapaLeaflet
          minhaPos={
            minhaPos
          }
          localizacoes={
            localizacoes
          }
        />
      </div>

      {/* =================================================
          BOTÃO CENTRALIZAR
      ================================================= */}

      <div
        style={{
          position:
            "fixed",
          bottom:
            "90px",
          left:
            "24px",
          zIndex:
            100
        }}
      >
        <button
          style={{
            width:
              "44px",
            height:
              "44px",
            borderRadius:
              "50%",
            backgroundColor:
              cores.branco,
            border:
              "none",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            cursor:
              "pointer",
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.15)"
          }}
        >
          <Navigation
            size={20}
            color={
              cores.roxo
            }
          />
        </button>
      </div>

      {/* =================================================
          BOTÃO GRUPOS
      ================================================= */}

      <div
        style={{
          position:
            "fixed",
          bottom:
            "148px",
          right:
            "24px",
          zIndex:
            100
        }}
      >
        <button
          onClick={() =>
            setModalGrupos(
              true
            )
          }
          style={{
            width:
              "44px",
            height:
              "44px",
            borderRadius:
              "50%",
            backgroundColor:
              cores.branco,
            border:
              "none",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            cursor:
              "pointer",
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.15)",
            position:
              "relative"
          }}
        >
          <Layers
            size={20}
            color={
              cores.roxo
            }
          />

          {gruposSelecionados.size >
            0 && (
            <div
              style={{
                position:
                  "absolute",
                top:
                  "-4px",
                right:
                  "-4px",
                width:
                  "18px",
                height:
                  "18px",
                borderRadius:
                  "50%",
                backgroundColor:
                  cores.roxo,
                color:
                  "white",
                fontSize:
                  "10px",
                fontWeight:
                  "700",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center"
              }}
            >
              {
                gruposSelecionados.size
              }
            </div>
          )}
        </button>
      </div>

      {/* =================================================
          BOTÃO SOS
          
          Continua funcionando mesmo quando
          já existe um SOS ativo.
      ================================================= */}

      {!sosAtivo && (
        <div
          style={{
            position:
              "fixed",
            bottom:
              "90px",
            right:
              "24px",
            zIndex:
              100
          }}
        >
          <button
            onClick={
              ativarSOS
            }
            disabled={
              enviandoSOS
            }
            style={{
              width:
                "56px",
              height:
                "56px",
              borderRadius:
                "50%",
              backgroundColor:
                "#ef4444",
              border:
                "4px solid white",
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              cursor:
                enviandoSOS
                  ? "wait"
                  : "pointer",
              boxShadow:
                "0 4px 20px rgba(239,68,68,0.3)",
              animation:
                enviandoSOS
                  ? "sos-piscar 0.8s ease-in-out infinite"
                  : "none"
            }}
          >
            <AlertCircle
              size={24}
              color={
                cores.branco
              }
            />
          </button>
        </div>
      )}

      {/* =================================================
          POPUP SOS
          
          O popup pode ser fechado.
          Fechar NÃO cancela o alerta.
      ================================================= */}

      {sosAtivo &&
        popupSOS &&
        alertaSOS && (
          <div
            style={{
              position:
                "fixed",
              inset: 0,
              zIndex:
                500,
              display:
                "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding:
                "20px",
              backgroundColor:
                "rgba(0,0,0,0.35)"
            }}
          >

            <div
              style={{
                width:
                  "100%",
                maxWidth:
                  "380px",
                backgroundColor:
                  cores.branco,
                borderRadius:
                  "24px",
                padding:
                  "24px",
                boxShadow:
                  "0 12px 40px rgba(0,0,0,0.25)",
                position:
                  "relative"
              }}
            >

              {/* X */}

              <button
                onClick={
                  fecharPopupSOS
                }
                style={{
                  position:
                    "absolute",
                  top:
                    "14px",
                  right:
                    "14px",
                  width:
                    "36px",
                  height:
                    "36px",
                  borderRadius:
                    "50%",
                  border:
                    "none",
                  backgroundColor:
                    cores.fundo,
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  cursor:
                    "pointer"
                }}
              >
                <X
                  size={20}
                  color={
                    cores.lavanda
                  }
                />
              </button>

              {/* Ícone SOS */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  marginBottom:
                    "16px"
                }}
              >
                <div
                  style={{
                    width:
                      "100px",
                    height:
                      "100px",
                    borderRadius:
                      "50%",
                    backgroundColor:
                      "#dc2626",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    boxShadow:
                      "0 8px 30px rgba(239,68,68,0.45)",
                    animation:
                      "sos-alert-map 1s ease-in-out infinite"
                  }}
                >
                  <AlertCircle
                    size={52}
                    color="white"
                    strokeWidth={
                      2
                    }
                  />
                </div>
              </div>

              {/* Título */}

              <h2
                style={{
                  textAlign:
                    "center",
                  color:
                    cores.roxoEscuro,
                  fontSize:
                    "21px",
                  fontWeight:
                    "800",
                  margin:
                    "0 0 6px"
                }}
              >
                SOS ativado
              </h2>

              <p
                style={{
                  textAlign:
                    "center",
                  color:
                    cores.lavanda,
                  fontSize:
                    "13px",
                  margin:
                    "0 0 20px"
                }}
              >
                Seu alerta de emergência
                está ativo.
              </p>

              {/* =================================================
                  STATUS
              ================================================= */}

              <div
                style={{
                  backgroundColor:
                    cores.fundo,
                  borderRadius:
                    "16px",
                  padding:
                    "16px",
                  marginBottom:
                    "16px"
                }}
              >

                {/* Alerta */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "12px"
                  }}
                >
                  <span
                    style={{
                      color:
                        cores.lavanda,
                      fontSize:
                        "13px"
                    }}
                  >
                    Alerta enviado
                  </span>

                  <span
                    style={{
                      color:
                        "#16a34a",
                      fontSize:
                        "13px",
                      fontWeight:
                        "700"
                    }}
                  >
                    ✓ Confirmado
                  </span>
                </div>

                {/* Localização */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "12px"
                  }}
                >
                  <span
                    style={{
                      color:
                        cores.lavanda,
                      fontSize:
                        "13px"
                    }}
                  >
                    Localização
                  </span>

                  <span
                    style={{
                      color:
                        "#16a34a",
                      fontSize:
                        "13px",
                      fontWeight:
                        "700"
                    }}
                  >
                    ✓ Compartilhada
                  </span>
                </div>

                {/* Contatos */}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center"
                  }}
                >
                  <span
                    style={{
                      color:
                        cores.lavanda,
                      fontSize:
                        "13px"
                    }}
                  >
                    Contatos notificados
                  </span>

                  <span
                    style={{
                      color:
                        contatosNotificados
                          ? "#16a34a"
                          : cores.lavanda,
                      fontSize:
                        "13px",
                      fontWeight:
                        "700"
                    }}
                  >
                    {contatosNotificados
                      ? "✓ Notificados"
                      : "Aguardando..."}
                  </span>
                </div>
              </div>

              {/* =================================================
                  TEMPO
              ================================================= */}

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  gap:
                    "8px",
                  marginBottom:
                    "18px"
                }}
              >
                <Clock
                  size={17}
                  color={
                    cores.roxo
                  }
                />

                <span
                  style={{
                    color:
                      cores.roxo,
                    fontSize:
                      "14px",
                    fontWeight:
                      "700"
                  }}
                >
                  Alerta ativo por{" "}
                  {formatarTempo(
                    tempoRestante
                  )}
                </span>
              </div>

              {/* =================================================
                  CANCELAR
              ================================================= */}

              <button
                onClick={
                  cancelarSOS
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "13px",
                  borderRadius:
                    "13px",
                  backgroundColor:
                    "rgba(239,68,68,0.08)",
                  color:
                    "#dc2626",
                  border:
                    "1px solid rgba(239,68,68,0.25)",
                  cursor:
                    "pointer",
                  fontSize:
                    "14px",
                  fontWeight:
                    "700"
                }}
              >
                Cancelar SOS
              </button>

              <p
                style={{
                  textAlign:
                    "center",
                  color:
                    "#aaa",
                  fontSize:
                    "11px",
                  margin:
                    "12px 0 0"
                }}
              >
                Você pode fechar esta janela.
                O alerta continuará ativo.
              </p>
            </div>
          </div>
        )}

      {/* =================================================
          INDICADOR SOS ATIVO
          
          Aparece mesmo quando o popup foi fechado.
      ================================================= */}

      {sosAtivo &&
        !popupSOS && (
          <div
            style={{
              position:
                "fixed",
              top:
                "80px",
              right:
                "16px",
              zIndex:
                400
            }}
          >
            <button
              onClick={() =>
                setPopupSOS(
                  true
                )
              }
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap:
                  "8px",
                padding:
                  "10px 14px",
                borderRadius:
                  "20px",
                backgroundColor:
                  "#dc2626",
                color:
                  "white",
                border:
                  "none",
                cursor:
                  "pointer",
                boxShadow:
                  "0 4px 16px rgba(239,68,68,0.35)",
                animation:
                  "sos-piscar 1s ease-in-out infinite"
              }}
            >
              <AlertCircle
                size={17}
              />

              <span
                style={{
                  fontSize:
                    "12px",
                  fontWeight:
                    "700"
                }}
              >
                SOS ativo
              </span>
            </button>
          </div>
        )}

      {/* =================================================
          MODAL GRUPOS
      ================================================= */}

      {modalGrupos && (
        <>
          <div
            onClick={() =>
              setModalGrupos(
                false
              )
            }
            style={{
              position:
                "fixed",
              inset: 0,
              backgroundColor:
                "rgba(0,0,0,0.3)",
              zIndex:
                200
            }}
          />

          <div
            style={{
              position:
                "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor:
                cores.branco,
              borderRadius:
                "24px 24px 0 0",
              padding:
                "24px",
              zIndex:
                300,
              boxShadow:
                "0 -4px 24px rgba(90,73,151,0.15)",
              maxHeight:
                "80vh",
              overflowY:
                "auto"
            }}
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "20px"
              }}
            >
              <div>
                <h3
                  style={{
                    color:
                      cores.roxoEscuro,
                    margin:
                      0,
                    fontSize:
                      "17px"
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
                    fontSize:
                      "12px"
                  }}
                >
                  Selecione quais grupos
                  visualizar
                </p>
              </div>

              <button
                onClick={() =>
                  setModalGrupos(
                    false
                  )
                }
                style={{
                  background:
                    "none",
                  border:
                    "none",
                  cursor:
                    "pointer"
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

            {grupos.length >
              1 && (
              <button
                onClick={
                  toggleTodos
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "12px 16px",
                  borderRadius:
                    "12px",
                  backgroundColor:
                    cores.fundo,
                  border:
                    "none",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  cursor:
                    "pointer",
                  marginBottom:
                    "12px"
                }}
              >
                <span
                  style={{
                    fontSize:
                      "13px",
                    fontWeight:
                      "600",
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
                    width:
                      "20px",
                    height:
                      "20px",
                    borderRadius:
                      "6px",
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
                    display:
                      "flex",
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

            {grupos.length ===
            0 ? (
              <p
                style={{
                  color:
                    cores.lavanda,
                  fontSize:
                    "14px",
                  textAlign:
                    "center"
                }}
              >
                Nenhum grupo criado
                ainda.
              </p>
            ) : (
              grupos.map(
                (grupo) => {
                  const ativo =
                    gruposSelecionados.has(
                      grupo.id
                    )

                  return (
                    <button
                      key={
                        grupo.id
                      }
                      onClick={() =>
                        toggleGrupo(
                          grupo.id
                        )
                      }
                      style={{
                        width:
                          "100%",
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
                        gap:
                          "12px",
                        cursor:
                          "pointer",
                        marginBottom:
                          "8px"
                      }}
                    >
                      <div
                        style={{
                          width:
                            "40px",
                          height:
                            "40px",
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
                          flexShrink:
                            0
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
                            margin:
                              0,
                            fontSize:
                              "14px",
                            fontWeight:
                              "600",
                            color:
                              cores.roxoEscuro
                          }}
                        >
                          {
                            grupo.nome
                          }
                        </p>

                        <p
                          style={{
                            margin:
                              0,
                            fontSize:
                              "12px",
                            color:
                              cores.lavanda
                          }}
                        >
                          {(grupo.membros
                            ?.length ||
                            1) -
                            1}{" "}
                          membro
                          {((
                            grupo.membros
                              ?.length ||
                            1
                          ) -
                            1) !==
                          1
                            ? "s"
                            : ""}{" "}
                          além de você
                        </p>
                      </div>

                      <div
                        style={{
                          width:
                            "22px",
                          height:
                            "22px",
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
                          flexShrink:
                            0
                        }}
                      >
                        {ativo && (
                          <Check
                            size={
                              13
                            }
                            color="white"
                          />
                        )}
                      </div>
                    </button>
                  )
                }
              )
            )}

            <button
              onClick={() =>
                setModalGrupos(
                  false
                )
              }
              style={{
                width:
                  "100%",
                marginTop:
                  "8px",
                padding:
                  "14px",
                backgroundColor:
                  cores.roxo,
                color:
                  "white",
                border:
                  "none",
                borderRadius:
                  "14px",
                fontSize:
                  "14px",
                fontWeight:
                  "600",
                cursor:
                  "pointer"
              }}
            >
              Ver no mapa
            </button>
          </div>
        </>
      )}

      {/* =================================================
          NAVBAR
          
          Fica sempre embaixo.
      ================================================= */}

      <div
        style={{
          position:
            "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor:
            cores.branco,
          borderTop:
            `1px solid ${cores.fundo}`,
          display:
            "flex",
          justifyContent:
            "space-around",
          padding:
            "10px 0",
          boxShadow:
            "0 -2px 12px rgba(90,73,151,0.08)",
          zIndex:
            1000
        }}
      >
        {nav.map(
          (item) => {
            const ativo =
              pathname ===
              item.href

            return (
              <Link
                key={
                  item.label
                }
                href={
                  item.href
                }
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  gap:
                    "4px",
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
                    size={
                      20
                    }
                  />
                </div>

                <span
                  style={{
                    fontSize:
                      "10px",
                    fontWeight:
                      ativo
                        ? "600"
                        : "400"
                  }}
                >
                  {
                    item.label
                  }
                </span>
              </Link>
            )
          }
        )}
      </div>

      {/* =================================================
          ANIMAÇÕES
      ================================================= */}

      <style>
        {`
          @keyframes sos-alert-map {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
              box-shadow:
                0 8px 30px rgba(239,68,68,0.45);
            }

            50% {
              opacity: 0.55;
              transform: scale(1.06);
              box-shadow:
                0 8px 45px rgba(239,68,68,0.9);
            }
          }

          @keyframes sos-piscar {
            0%, 100% {
              opacity: 1;
            }

            50% {
              opacity: 0.55;
            }
          }
        `}
      </style>
    </div>
  )
}