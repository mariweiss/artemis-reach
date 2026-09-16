"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc } from "firebase/firestore"

export function useSOS() {
  const [sosAtivo, setSosAtivo] = useState(false)
  const [alertaId, setAlertaId] = useState<string | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  // Escuta se existe um SOS ativo do usuário
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUsuarioId(user.uid)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!usuarioId) return
    const q = query(
      collection(db, "alertas_sos"),
      where("usuario_id", "==", usuarioId),
      where("ativo", "==", true)
    )
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setSosAtivo(true)
        setAlertaId(snap.docs[0].id)
      } else {
        setSosAtivo(false)
        setAlertaId(null)
      }
    })
    return () => unsub()
  }, [usuarioId])

  // Aciona o SOS (cria 1 alerta)
  async function acionarSOS(nomeUsuario: string) {
    if (!usuarioId) return
    if (sosAtivo) return // já tem um ativo, não duplica

    // Pega última localização
    let latitude: number | null = null
    let longitude: number | null = null
    try {
      const locSnap = await getDoc(doc(db, "localizacoes", usuarioId))
      if (locSnap.exists()) {
        const dados = locSnap.data() as any
        latitude = dados.latitude
        longitude = dados.longitude
      }
    } catch {}

    const alerta: any = {
      usuario_id: usuarioId,
      origem: "app",
      ativo: true,
      mensagem: `${nomeUsuario} acionou o botão SOS!`,
      criado_em: new Date().toISOString()
    }
    if (latitude !== null && longitude !== null) {
      alerta.latitude = latitude
      alerta.longitude = longitude
    }

    await addDoc(collection(db, "alertas_sos"), alerta)
  }

  // Cancela o SOS ativo
  async function cancelarSOS() {
    if (!alertaId) return
    await updateDoc(doc(db, "alertas_sos", alertaId), { ativo: false })
  }

  return { sosAtivo, acionarSOS, cancelarSOS }
}