import { Capacitor, registerPlugin } from "@capacitor/core"

// Detecta se está rodando no app nativo ou no navegador
export function isApp() {
  return Capacitor.isNativePlatform()
}

// Rastreia a localização — funciona no site E no app
export async function iniciarRastreamento(
  callback: (lat: number, lng: number) => void,
  onErro?: () => void
) {
  if (isApp()) {
    // ─── APP NATIVO ───
    const BackgroundGeolocation: any = registerPlugin("BackgroundGeolocation")

    const watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "Sua localização está sendo compartilhada com seu círculo de segurança.",
        backgroundTitle: "Artemis protegendo você",
        requestPermissions: true,
        stale: true,
        distanceFilter: 0,
      },
      (location: any, error: any) => {
        console.log("GPS BACKGROUND CALLBACK:", location, error)
        if (error) {
          if (error.code === "NOT_AUTHORIZED") {
            if (onErro) onErro()
          }
          return
        }
        if (location) {
          callback(location.latitude, location.longitude)
        }
      }
    )

    return () => {
      BackgroundGeolocation.removeWatcher({ id: watcherId })
    }
  } else {
    // ─── SITE (NAVEGADOR) ───
    if (!navigator.geolocation) {
      if (onErro) onErro()
      return () => { }
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => callback(pos.coords.latitude, pos.coords.longitude),
      () => { if (onErro) onErro() },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }
}