"use client"

import { useEffect } from "react"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"

export function usePresenca() {
  useEffect(() => {
    let intervalo: any = null

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return

      // Verifica se a usuária permite mostrar status online
      async function atualizarPresenca() {
        try {
          const { getDoc } = await import("firebase/firestore")
          const perfil = await getDoc(doc(db, "usuarios", user!.uid))
          const mostraOnline = perfil.data()?.privacidade?.statusOnline !== false

          if (mostraOnline) {
            await setDoc(doc(db, "presenca", user!.uid), {
              usuario_id: user!.uid,
              ultimo_online: new Date().toISOString()
            })
          }
        } catch {}
      }

      atualizarPresenca()
      intervalo = setInterval(atualizarPresenca, 30000) // a cada 30s
    })

    return () => {
      unsub()
      if (intervalo) clearInterval(intervalo)
    }
  }, [])
}