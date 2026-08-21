"use client"

import { useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, setDoc, deleteDoc, addDoc, collection } from "firebase/firestore"

let pararRastreamento: any = null
let ultimoSalvo = 0

export function useLocalizacao() {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const uid = user.uid

      // Se já está rastreando, não inicia de novo
      if (pararRastreamento) return

      const { iniciarRastreamento } = await import("../utils/localizacao")

      pararRastreamento = await iniciarRastreamento(
        async (latitude, longitude) => {
          const perfilSnap = await getDoc(doc(db, "usuarios", uid))
          const compartilha = perfilSnap.data()?.privacidade?.locReal !== false

          if (compartilha) {
            await setDoc(doc(db, "localizacoes", uid), {
              usuario_id: uid, latitude, longitude,
              atualizado_em: new Date().toISOString()
            })

            const salvarHistorico = perfilSnap.data()?.privacidade?.historico !== false
            const agora = Date.now()
            if (salvarHistorico && (agora - ultimoSalvo > 30000)) {
              ultimoSalvo = agora
              const hoje = new Date().toISOString().split("T")[0]
              await addDoc(collection(db, "historico_rotas"), {
                usuario_id: uid, latitude, longitude,
                data: hoje, timestamp: new Date().toISOString()
              })
            }
          } else {
            try { await deleteDoc(doc(db, "localizacoes", uid)) } catch {}
          }
        }
      )
    })

    return () => unsub()
  }, [])
}