"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, addDoc, collection, updateDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  MapPin,
  Users,
  MessageSquare,
  Home,
  Bell,
  Phone,
  Share2,
  AlertCircle,
  VolumeX,
  Volume2,
  Shield
} from "lucide-react"
import Header from "../componentes/Header"
import { useTema } from "../contexts/ThemeContext"
import { getCores } from "../cores"
import { usePresenca } from "../hooks/usePresenca"
import { useLocalizacao } from "../hooks/useLocalizacao"
import AvisoBateria from "../componentes/AvisoBateria"

const nav = [
  { icon: Home, label: "Início", href: "/inicio" },
  { icon: MapPin, label: "Mapa", href: "/mapa" },
  { icon: Users, label: "Círculo", href: "/circulo" },
  { icon: MessageSquare, label: "Comunidade", href: "/comunidade" },
  { icon: Bell, label: "Alertas", href: "/alertas" },
]

const TEMPO_SOS = 2 * 60 * 1000

export default function Inicio() {
  const pathname = usePathname()
  const router = useRouter()
  const { isDark } = useTema()
  const cores = getCores(isDark)

  usePresenca()
  useLocalizacao()

  const [usuario, setUsuario] = useState<any>(null)
  const [nomeUsuario, setNomeUsuario] = useState("")
  const [modoSilencioso, setModoSilencioso] = useState(false)

  const [contando, setContando] = useState(false)
  const [contador, setContador] = useState(5)

  const [alertaEnviado, setAlertaEnviado] = useState(false)
  const [enviandoSOS, setEnviandoSOS] = useState(false)
  const [sosAtivo, setSosAtivo] = useState(false)

  const [idAlertaSOS, setIdAlertaSOS] = useState<string | null>(null)

  /*
   * Guarda o momento em que o Firebase confirmou o envio.
   * Isso permite que o SOS continue ativo mesmo quando
   * o usuário troca de aba.
   */
  const [inicioSOS, setInicioSOS] = useState<number | null>(null)

  /*
   * Recupera os dados do SOS quando o usuário volta para
   * a tela inicial.
   */
  useEffect(() => {
    if (!usuario) return

    try {
      const dadosSalvos = localStorage.getItem(
        `artemis_sos_${usuario.uid}`
      )

      if (!dadosSalvos) return

      const dados = JSON.parse(dadosSalvos)

      /*
       * Se ainda estiver enviando, recupera o estado.
       */
      if (dados.status === "enviando") {
        setEnviandoSOS(true)
        setSosAtivo(true)
        setAlertaEnviado(false)
        setIdAlertaSOS(dados.idAlertaSOS || null)
        return
      }

      /*
       * Se o SOS já foi enviado, verifica quanto tempo passou.
       */
      if (dados.status === "enviado" && dados.inicioSOS) {
        const tempoPassado = Date.now() - dados.inicioSOS

        /*
         * Se os 2 minutos já passaram, limpa tudo.
         */
        if (tempoPassado >= TEMPO_SOS) {
          localStorage.removeItem(
            `artemis_sos_${usuario.uid}`
          )

          setSosAtivo(false)
          setAlertaEnviado(false)
          setEnviandoSOS(false)
          setIdAlertaSOS(null)
          setInicioSOS(null)
          setContador(5)

          return
        }

        /*
         * Ainda está dentro dos 2 minutos.
         */
        setSosAtivo(true)
        setAlertaEnviado(true)
        setEnviandoSOS(false)
        setIdAlertaSOS(dados.idAlertaSOS || null)
        setInicioSOS(dados.inicioSOS)
      }

    } catch (error) {
      console.error(
        "Erro ao recuperar estado do SOS:",
        error
      )
    }
  }, [usuario])

  /*
   * Mantém o SOS ativo até completar 2 minutos,
   * mesmo se o usuário voltar para a página depois.
   */
  useEffect(() => {
    if (!inicioSOS || !usuario || !sosAtivo) return

    const verificarTempo = () => {
      const tempoPassado = Date.now() - inicioSOS

      if (tempoPassado >= TEMPO_SOS) {
        localStorage.removeItem(
          `artemis_sos_${usuario.uid}`
        )

        setAlertaEnviado(false)
        setSosAtivo(false)
        setEnviandoSOS(false)
        setIdAlertaSOS(null)
        setInicioSOS(null)
        setContador(5)

        return true
      }

      return false
    }

    /*
     * Verifica imediatamente.
     */
    if (verificarTempo()) return

    /*
     * Verifica periodicamente para garantir que,
     * mesmo estando na página, ele volte ao normal
     * exatamente após os 2 minutos.
     */
    const intervalo = setInterval(() => {
      verificarTempo()
    }, 1000)

    /*
     * Também cria um timeout próximo do momento exato
     * dos 2 minutos.
     */
    const restante =
      TEMPO_SOS - (Date.now() - inicioSOS)

    const timer = setTimeout(() => {
      localStorage.removeItem(
        `artemis_sos_${usuario.uid}`
      )

      setAlertaEnviado(false)
      setSosAtivo(false)
      setEnviandoSOS(false)
      setIdAlertaSOS(null)
      setInicioSOS(null)
      setContador(5)
    }, restante)

    return () => {
      clearInterval(intervalo)
      clearTimeout(timer)
    }
  }, [inicioSOS, usuario, sosAtivo])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/")
        return
      }

      setUsuario(user)

      try {
        const snap = await getDoc(
          doc(db, "usuarios", user.uid)
        )

        if (snap.exists()) {
          setNomeUsuario(
            snap.data().nome?.split(" ")[0] || "Usuária"
          )
        }
      } catch { }
    })

    return () => unsub()
  }, [])

  /*
   * Contagem regressiva
   */
  useEffect(() => {
    if (!contando) return

    if (contador <= 0) {
      enviarSOS()
      return
    }

    const t = setTimeout(
      () => setContador(contador - 1),
      1000
    )

    return () => clearTimeout(t)
  }, [contando, contador])

  function iniciarSOS() {
    /*
     * Impede iniciar outro SOS se já existir um ativo.
     */
    if (sosAtivo || enviandoSOS) return

    setContando(true)
    setContador(5)
    setAlertaEnviado(false)
    setEnviandoSOS(false)
    setSosAtivo(false)
    setIdAlertaSOS(null)
    setInicioSOS(null)
  }

  function cancelarSOS() {
    setContando(false)
    setContador(5)
  }

  async function enviarSOS() {
    setContando(false)
    setEnviandoSOS(true)
    setAlertaEnviado(false)
    setSosAtivo(true)

    /*
     * Salva imediatamente que o envio começou.
     * Assim, se o usuário mudar de aba enquanto
     * estiver esperando o Firebase, o estado não some.
     */
    if (usuario) {
      localStorage.setItem(
        `artemis_sos_${usuario.uid}`,
        JSON.stringify({
          status: "enviando",
          idAlertaSOS: null
        })
      )
    }

    try {
      /*
       * Verifica se o botão SOS está ativado
       * nas configurações.
       */
      const perfilSnap = await getDoc(
        doc(db, "usuarios", usuario?.uid || "")
      )

      const sosAtivado =
        perfilSnap.data()?.seguranca?.sosAtivo !== false

      if (!sosAtivado) {
        alert(
          "O botão SOS está desativado nas configurações de segurança."
        )

        localStorage.removeItem(
          `artemis_sos_${usuario.uid}`
        )

        setEnviandoSOS(false)
        setSosAtivo(false)
        setContador(5)

        return
      }

      /*
       * Função responsável por criar o alerta no Firebase.
       */
      const criarAlerta = async (
        latitude?: number,
        longitude?: number
      ) => {
        try {
          const dadosAlerta: any = {
            usuario_id: usuario?.uid,
            origem: "app",
            ativo: true,
            mensagem: `${nomeUsuario} ativou o botão SOS!`,
            modo_silencioso: modoSilencioso,
            criado_em: new Date().toISOString()
          }

          if (
            latitude !== undefined &&
            longitude !== undefined
          ) {
            dadosAlerta.latitude = latitude
            dadosAlerta.longitude = longitude
          }

          const alertaRef = await addDoc(
            collection(db, "alertas_sos"),
            dadosAlerta
          )

          /*
           * O Firebase confirmou.
           * A partir daqui começam os 2 minutos.
           */
          const agora = Date.now()

          setIdAlertaSOS(alertaRef.id)
          setEnviandoSOS(false)
          setAlertaEnviado(true)
          setSosAtivo(true)
          setContador(5)
          setInicioSOS(agora)

          /*
           * Salva o estado no navegador.
           * Isso é o que permite continuar ativo
           * quando trocar de aba.
           */
          localStorage.setItem(
            `artemis_sos_${usuario.uid}`,
            JSON.stringify({
              status: "enviado",
              idAlertaSOS: alertaRef.id,
              inicioSOS: agora
            })
          )

        } catch (error) {
          console.error(
            "Erro ao enviar SOS:",
            error
          )

          localStorage.removeItem(
            `artemis_sos_${usuario.uid}`
          )

          setEnviandoSOS(false)
          setSosAtivo(false)
          setAlertaEnviado(false)

          alert(
            "Não foi possível enviar o alerta SOS. Tente novamente."
          )

          setContador(5)
        }
      }

      /*
       * Tenta obter a localização.
       */
      navigator.geolocation?.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords

          await criarAlerta(
            latitude,
            longitude
          )
        },

        async () => {
          /*
           * Se a localização não estiver disponível,
           * o alerta continua sendo enviado.
           */
          await criarAlerta()
        }
      )

    } catch (error) {
      console.error(
        "Erro ao verificar configurações do SOS:",
        error
      )

      localStorage.removeItem(
        `artemis_sos_${usuario?.uid}`
      )

      setEnviandoSOS(false)
      setSosAtivo(false)
      setAlertaEnviado(false)

      alert(
        "Não foi possível enviar o alerta SOS. Tente novamente."
      )

      setContador(5)
    }
  }

  async function cancelarSOSAtivo() {
    if (!idAlertaSOS) {
      localStorage.removeItem(
        `artemis_sos_${usuario?.uid}`
      )

      setSosAtivo(false)
      setAlertaEnviado(false)
      setEnviandoSOS(false)
      setInicioSOS(null)

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

      /*
       * Remove o SOS salvo no navegador.
       */
      localStorage.removeItem(
        `artemis_sos_${usuario?.uid}`
      )

      setSosAtivo(false)
      setAlertaEnviado(false)
      setEnviandoSOS(false)
      setIdAlertaSOS(null)
      setInicioSOS(null)
      setContador(5)

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

  function compartilharLocalizacao() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } =
          pos.coords

        const link =
          `https://maps.google.com/?q=${latitude},${longitude}`

        const mensagem =
          `Estou compartilhando minha localização em tempo real pelo Artemis: ${link}`

        if (navigator.share) {
          navigator.share({
            title: "Minha localização",
            text: mensagem,
          }).catch(() => { })
        } else {
          window.open(
            `https://wa.me/?text=${encodeURIComponent(mensagem)}`,
            "_blank"
          )
        }
      },
      () => {
        alert(
          "Não foi possível obter sua localização."
        )
      }
    )
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

      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
          padding: "24px 16px 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: cores.texto,
            margin: "0 0 4px",
            textAlign: "center"
          }}
        >
          Olá, {nomeUsuario || "Usuária"}!
        </h2>

        <p
          style={{
            color: cores.textoSecundario,
            fontSize: "14px",
            marginBottom: "40px",
            textAlign: "center"
          }}
        >
          Sua segurança em um toque
        </p>

        {/* Botão SOS central */}
        <div
          style={{
            position: "relative",
            marginBottom: "24px"
          }}
        >

          {/* Estado normal */}
          {!contando &&
            !enviandoSOS &&
            !sosAtivo ? (

            <button
              onClick={iniciarSOS}
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow:
                  "0 8px 32px rgba(239,68,68,0.4)",
                animation:
                  "pulse-sos 2s ease-in-out infinite"
              }}
            >
              <AlertCircle
                size={56}
                color="white"
              />

              <span
                style={{
                  color: "white",
                  fontSize: "28px",
                  fontWeight: "800",
                  letterSpacing: "2px"
                }}
              >
                SOS
              </span>

              <span
                style={{
                  color:
                    "rgba(255,255,255,0.9)",
                  fontSize: "12px"
                }}
              >
                Toque para acionar
              </span>
            </button>

          ) : contando ? (

            /* Contagem regressiva */
            <button
              onClick={cancelarSOS}
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                backgroundColor: "#dc2626",
                border: "6px solid white",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                boxShadow:
                  "0 8px 32px rgba(239,68,68,0.6)",
                animation:
                  "sos-alert 0.8s ease-in-out infinite"
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "64px",
                  fontWeight: "800"
                }}
              >
                {contador}
              </span>

              <span
                style={{
                  color:
                    "rgba(255,255,255,0.9)",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Toque para cancelar
              </span>
            </button>

          ) : (

            /* Enviando / SOS ativo */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px"
              }}
            >

              <div
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  backgroundColor: "#dc2626",
                  border: "6px solid white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow:
                    "0 8px 32px rgba(239,68,68,0.7)",
                  animation:
                    "sos-alert 1s ease-in-out infinite"
                }}
              >
                <AlertCircle
                  size={48}
                  color="white"
                />

                <span
                  style={{
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "800",
                    textAlign: "center"
                  }}
                >
                  SOS
                </span>

                <span
                  style={{
                    color:
                      "rgba(255,255,255,0.9)",
                    fontSize: "12px",
                    textAlign: "center"
                  }}
                >
                  {enviandoSOS
                    ? "Enviando alerta..."
                    : "Alerta enviado!"}
                </span>
              </div>

            </div>
          )}
        </div>

        {/* Mensagem de envio */}
        {enviandoSOS && (
          <div
            style={{
              backgroundColor:
                "rgba(239,68,68,0.1)",
              borderRadius: "14px",
              padding: "14px 20px",
              marginBottom: "16px",
              border:
                "1px solid rgba(239,68,68,0.3)",
              textAlign: "center",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#dc2626",
                fontWeight: "600",
                fontSize: "14px"
              }}
            >
              Enviando alerta para seus contatos...
            </p>

            <p
              style={{
                margin: "5px 0 0",
                color:
                  cores.textoSecundario,
                fontSize: "12px"
              }}
            >
              Aguarde a confirmação do envio.
            </p>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {alertaEnviado && sosAtivo && (
          <div
            style={{
              backgroundColor:
                "rgba(34,197,94,0.1)",
              borderRadius: "14px",
              padding: "14px 20px",
              marginBottom: "16px",
              border:
                "1px solid rgba(34,197,94,0.3)",
              textAlign: "center",
              width: "100%",
              boxSizing: "border-box"
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#16a34a",
                fontWeight: "700",
                fontSize: "15px"
              }}
            >
              ✓ Alerta enviado!
            </p>

            <p
              style={{
                margin: "5px 0 0",
                color:
                  cores.textoSecundario,
                fontSize: "12px"
              }}
            >
              Seus contatos de confiança
              foram notificados.
            </p>
          </div>
        )}

        {/* Cancelar SOS */}
        {sosAtivo && !enviandoSOS && (
          <button
            onClick={cancelarSOSAtivo}
            style={{
              width: "100%",
              maxWidth: "300px",
              padding: "13px 20px",
              borderRadius: "14px",
              backgroundColor:
                cores.branco,
              color: "#dc2626",
              border:
                "1.5px solid #dc2626",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              marginBottom: "24px"
            }}
          >
            Cancelar SOS
          </button>
        )}

        {/* Modo silencioso */}
        <button
          onClick={() =>
            setModoSilencioso(
              !modoSilencioso
            )
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor:
              modoSilencioso
                ? cores.roxo
                : cores.branco,
            color:
              modoSilencioso
                ? (isDark
                  ? cores.fundo
                  : "white")
                : cores.texto,
            border:
              `1.5px solid ${modoSilencioso
                ? cores.roxo
                : cores.borda
              }`,
            borderRadius: "20px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "32px"
          }}
        >
          {modoSilencioso
            ? <VolumeX size={16} />
            : <Volume2 size={16} />}

          Modo silencioso{" "}
          {modoSilencioso
            ? "ativo"
            : "inativo"}
        </button>

        {/* Botões de ação */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            width: "100%"
          }}
        >

          {/* Ligar 190 */}
          <a
            href="tel:190"
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "16px",
              backgroundColor:
                cores.branco,
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              boxShadow:
                "0 2px 8px " +
                cores.sombra,
              border:
                "1px solid " +
                cores.borda
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor:
                  "rgba(239,68,68,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Phone
                size={22}
                color="#ef4444"
              />
            </div>

            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: cores.texto
              }}
            >
              Ligar 190
            </span>
          </a>

          {/* Compartilhar localização */}
          <button
            onClick={
              compartilharLocalizacao
            }
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: "16px",
              backgroundColor:
                cores.branco,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              boxShadow:
                "0 2px 8px " +
                cores.sombra,
              border:
                "1px solid " +
                cores.borda
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor:
                  "rgba(90,73,151,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Share2
                size={22}
                color={cores.roxo}
              />
            </div>

            <span
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: cores.texto
              }}
            >
              Compartilhar localização
            </span>
          </button>
        </div>
      </div>

      {/* Aviso para manter o app aberto */}
      <div style={{
        marginTop: "24px auto 0", padding: "14px 16px", borderRadius: "12px",
        backgroundColor: "rgba(90,73,151,0.06)",
        border: `1px solid ${cores.borda}`,
        display: "flex", alignItems: "center", gap: "10px", maxWidth: "500px", width:"100%", boxSizing: "border-box" 
      }}>
        <Shield size={18} color={cores.roxo} style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: "12px", color: cores.textoSecundario, lineHeight: "1.5", flex: 1 }}>
          Mantenha o Artemis aberto ou minimizado para proteção contínua. Evite fechar o app completamente.
        </p>
      </div>

      <AvisoBateria />
      {/* Navbar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor:
            cores.branco,
          borderTop:
            "1px solid " +
            cores.fundo,
          display: "flex",
          justifyContent:
            "space-around",
          padding: "10px 0",
          boxShadow:
            "0 -2px 12px " +
            cores.sombra,
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
                    : cores.textoSecundario
              }}
            >
              <div
                style={{
                  padding: "6px 16px",
                  borderRadius: "12px",
                  backgroundColor:
                    ativo
                      ? "rgba(90,73,151,0.1)"
                      : "transparent"
                }}
              >
                <item.icon size={20} />
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

      <style>{`
        @keyframes pulse-sos {
          0%, 100% {
            box-shadow:
              0 8px 32px rgba(239,68,68,0.4);
          }

          50% {
            box-shadow:
              0 8px 42px rgba(239,68,68,0.7);
          }
        }

        @keyframes sos-alert {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            box-shadow:
              0 8px 32px rgba(239,68,68,0.7);
          }

          50% {
            opacity: 0.55;
            transform: scale(1.03);
            box-shadow:
              0 8px 45px rgba(239,68,68,1);
          }
        }
      `}</style>
    </div>
  )
}
