"use client"

import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"

export function usePushNotifications() {
  useEffect(() => {
    // Só funciona no app nativo
    if (!Capacitor.isNativePlatform()) return

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return
      const uid = user.uid

      try {
        const { PushNotifications } = await import("@capacitor/push-notifications")

        // Pede permissão
        let permStatus = await PushNotifications.checkPermissions()
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions()
        }
        if (permStatus.receive !== "granted") {
          console.log("Permissão de notificação negada")
          return
        }

        // Registra para receber push
        await PushNotifications.register()

        // Quando o token é gerado, salva no Firebase
        PushNotifications.addListener("registration", async (token) => {
          console.log("Token FCM:", token.value)
          await setDoc(doc(db, "usuarios", uid), {
            fcmToken: token.value
          }, { merge: true })
        })

        // Erro no registro
        PushNotifications.addListener("registrationError", (err) => {
          console.error("Erro no registro de push:", err)
        })

        // Quando recebe notificação com o app aberto
        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push recebido:", notification)
        })

        // Quando toca na notificação
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          console.log("Push tocado:", action)
        })

      } catch (e) {
        console.error("Erro ao configurar push:", e)
      }
    })

    return () => unsub()
  }, [])
}