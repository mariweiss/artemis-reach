"use client"

import { useEffect, useRef } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, onSnapshot, getDoc, doc, getDocs } from "firebase/firestore"

export function useNotificacaoAlerta() {
  const jaVistosRef = useRef<Set<string>>(new Set())
  const primeiraCargaRef = useRef(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const uid = user.uid

      // Busca IDs do círculo e grupos
      const idsSet = new Set<string>()

      const qCirculo = query(
        collection(db, "circulos"),
        where("usuarios", "array-contains", uid),
        where("status", "==", "confirmado")
      )
      const snapCirculo = await getDocs(qCirculo)
      snapCirculo.docs.forEach(d => {
        const data = d.data() as any
        data.usuarios.filter((id: string) => id !== uid).forEach((id: string) => idsSet.add(id))
      })

      const qGrupos = query(collection(db, "grupos"), where("membros", "array-contains", uid))
      const snapGrupos = await getDocs(qGrupos)
      snapGrupos.docs.forEach(d => {
        const data = d.data() as any
        ;(data.membros || []).filter((id: string) => id !== uid).forEach((id: string) => idsSet.add(id))
      })

      const ids = [...idsSet]
      if (ids.length === 0) return

      // Escuta alertas do círculo
      const qAlertas = query(
        collection(db, "alertas_sos"),
        where("usuario_id", "in", ids)
      )

      onSnapshot(qAlertas, (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const alerta = change.doc.data() as any
            const alertaId = change.doc.id

            // Ignora alertas da primeira carga (histórico)
            if (primeiraCargaRef.current) {
              jaVistosRef.current.add(alertaId)
              return
            }

            // Ignora se já viu ou se não está ativo
            if (jaVistosRef.current.has(alertaId)) return
            if (alerta.ativo === false) return

            jaVistosRef.current.add(alertaId)

            // Busca o nome de quem enviou
            let nome = "Alguém do seu círculo"
            try {
              const perfil = await getDoc(doc(db, "usuarios", alerta.usuario_id))
              if (perfil.exists()) nome = perfil.data()?.nome || nome
            } catch {}

            dispararNotificacao(nome)
          }
        })
        primeiraCargaRef.current = false
      })
    })

    return () => unsub()
  }, [])
}

function dispararNotificacao(nome: string) {
  // Toca som
  try {
    const audio = new Audio("/sounds/alarme.mp3")
    audio.play().catch(() => {})
  } catch {}

  // Vibra
  try {
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300])
  } catch {}

  // Mostra notificação do navegador/sistema
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚨 Alerta de emergência!", {
        body: `${nome} acionou um SOS. Toque para ver a localização.`,
        icon: "/icon.png"
      })
    }
  } catch {}
}