"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { Shield, Check, X } from "lucide-react"

const cores = {
  fundo: "#EEEAF8", roxo: "#5A4997",
  roxoEscuro: "#2F195F", roxoClaro: "#BB99FF",
  lavanda: "#8575BD", branco: "#FFFFFF",
}

export default function AceitarConvite() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [estado, setEstado] = useState("carregando")
  const [convite, setConvite] = useState(null)
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push(`/?redirect=/aceitar-convite?token=${token}`); return }
      setUsuario(user)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!token || !usuario) return
    async function buscarConvite() {
      const q = query(collection(db, "convites"), where("token", "==", token), where("status", "==", "pendente"))
      const snap = await getDocs(q)
      if (snap.empty) { setEstado("invalido"); return }
      const data = snap.docs[0]
      const conviteData = { id: data.id, ...data.data() }
      if (new Date(conviteData.expira_em) < new Date()) { setEstado("expirado"); return }
      if (conviteData.criador_id === usuario.uid) { setEstado("proprio"); return }
      setConvite(conviteData)
      setEstado("valido")
    }
    buscarConvite()
  }, [token, usuario])

  async function aceitar() {
    await addDoc(collection(db, "circulos"), {
      usuarios: [convite.criador_id, usuario.uid],
      status: "confirmado",
      compartilha: { [convite.criador_id]: false, [usuario.uid]: false },
      criado_em: new Date().toISOString()
    })
    await updateDoc(doc(db, "convites", convite.id), { status: "aceito" })
    setEstado("aceito")
    setTimeout(() => router.push("/circulo"), 2000)
  }

  async function recusar() {
    await updateDoc(doc(db, "convites", convite.id), { status: "recusado" })
    router.push("/inicio")
  }

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: cores.fundo,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "sans-serif"
    }}>
      <div style={{
        backgroundColor: cores.branco, borderRadius: "20px",
        padding: "32px", maxWidth: "400px", width: "100%",
        boxShadow: "0 4px 24px rgba(90,73,151,0.12)", textAlign: "center"
      }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          backgroundColor: cores.roxo, display: "flex",
          alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
        }}>
          <Shield size={28} color="white" />
        </div>

        {estado === "carregando" && <p style={{ color: cores.lavanda }}>Verificando convite...</p>}

        {estado === "invalido" && <>
          <h2 style={{ color: cores.roxoEscuro }}>Link inválido</h2>
          <p style={{ color: cores.lavanda }}>Este convite não existe ou já foi usado.</p>
        </>}

        {estado === "expirado" && <>
          <h2 style={{ color: cores.roxoEscuro }}>Link expirado</h2>
          <p style={{ color: cores.lavanda }}>Este convite expirou. Peça um novo link.</p>
        </>}

        {estado === "proprio" && <>
          <h2 style={{ color: cores.roxoEscuro }}>Link inválido</h2>
          <p style={{ color: cores.lavanda }}>Você não pode aceitar seu próprio convite.</p>
        </>}

        {estado === "aceito" && <>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            backgroundColor: "rgba(34,197,94,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 12px"
          }}>
            <Check size={24} color="#16a34a" />
          </div>
          <h2 style={{ color: cores.roxoEscuro }}>Conexão confirmada!</h2>
          <p style={{ color: cores.lavanda }}>Redirecionando para o seu círculo...</p>
        </>}

        {estado === "valido" && convite && <>
          <h2 style={{ color: cores.roxoEscuro, marginBottom: "8px" }}>Convite do círculo</h2>
          <p style={{ color: cores.lavanda, marginBottom: "24px" }}>
            <strong style={{ color: cores.roxoEscuro }}>{convite.criador_nome}</strong> te convidou para o círculo de segurança no Artemis.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={recusar} style={{
              flex: 1, padding: "12px", borderRadius: "12px",
              border: `1px solid ${cores.roxoClaro}`, backgroundColor: "transparent",
              color: cores.roxo, cursor: "pointer", fontSize: "14px"
            }}>
              Recusar
            </button>
            <button onClick={aceitar} style={{
              flex: 1, padding: "12px", borderRadius: "12px",
              border: "none", backgroundColor: cores.roxo,
              color: "white", cursor: "pointer",
              fontSize: "14px", fontWeight: "600"
            }}>
              Aceitar
            </button>
          </div>
        </>}
      </div>
    </div>
  )
}