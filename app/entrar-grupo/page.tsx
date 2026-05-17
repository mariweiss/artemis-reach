"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { Shield, Check, X, Users } from "lucide-react"

const cores = {
  fundo: "#EEEAF8", roxo: "#5A4997", roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF", lavanda: "#8575BD", branco: "#FFFFFF",
}

export default function EntrarGrupo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [estado, setEstado] = useState("carregando")
  const [grupo, setGrupo] = useState<any>(null)
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push(`/?redirect=/entrar-grupo?token=${token}`); return }
      setUsuario(user)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!token || !usuario) return
    async function buscarGrupo() {
      const q = query(collection(db, "grupos"), where("token", "==", token))
      const snap = await getDocs(q)
      if (snap.empty) { setEstado("invalido"); return }
      const grupoData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any
      if (grupoData.membros?.includes(usuario.uid)) { setEstado("ja_membro"); return }
      setGrupo(grupoData)
      setEstado("valido")
    }
    buscarGrupo()
  }, [token, usuario])

  async function entrar() {
    if (!grupo || !usuario) return
    await updateDoc(doc(db, "grupos", grupo.id), {
      membros: [...(grupo.membros || []), usuario.uid]
    })
    setEstado("entrou")
    setTimeout(() => router.push("/circulo"), 2000)
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
          backgroundColor: grupo?.cor || cores.roxo,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          <Users size={28} color="white" />
        </div>

        {estado === "carregando" && <p style={{ color: cores.lavanda }}>Verificando convite...</p>}

        {estado === "invalido" && <>
          <h2 style={{ color: cores.roxoEscuro }}>Link inválido</h2>
          <p style={{ color: cores.lavanda }}>Este grupo não existe ou o link está incorreto.</p>
        </>}

        {estado === "ja_membro" && <>
          <h2 style={{ color: cores.roxoEscuro }}>Você já está neste grupo!</h2>
          <button onClick={() => router.push("/circulo")} style={{ marginTop: "16px", padding: "12px 24px", borderRadius: "12px", border: "none", backgroundColor: cores.roxo, color: "white", cursor: "pointer", fontWeight: "600" }}>
            Ver meus grupos
          </button>
        </>}

        {estado === "entrou" && <>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Check size={24} color="#16a34a" />
          </div>
          <h2 style={{ color: cores.roxoEscuro }}>Você entrou no grupo!</h2>
          <p style={{ color: cores.lavanda }}>Redirecionando para o seu círculo...</p>
        </>}

        {estado === "valido" && grupo && <>
          <h2 style={{ color: cores.roxoEscuro, marginBottom: "8px" }}>
            Convite para o grupo
          </h2>
          <p style={{ color: cores.lavanda, marginBottom: "8px" }}>
            Você foi convidada para entrar no grupo
          </p>
          <p style={{ color: cores.roxoEscuro, fontWeight: "700", fontSize: "20px", marginBottom: "24px" }}>
            {grupo.nome}
          </p>
          <p style={{ color: "#bbb", fontSize: "12px", marginBottom: "24px" }}>
            {grupo.membros?.length || 0} membro{(grupo.membros?.length || 0) !== 1 ? "s" : ""} neste grupo
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => router.push("/inicio")} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1px solid ${cores.roxoClaro}`, backgroundColor: "transparent", color: cores.roxo, cursor: "pointer", fontSize: "14px" }}>
              Recusar
            </button>
            <button onClick={entrar} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: cores.roxo, color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
              Entrar no grupo
            </button>
          </div>
        </>}
      </div>
    </div>
  )
}