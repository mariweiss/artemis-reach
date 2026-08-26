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
        backgroundMessage: "Artemis está protegendo você",
        backgroundTitle: "Localização ativa",
        requestPermissions: true,
        stale: false,
        distanceFilter: 3,
      },
      (location: any, error: any) => {
        console.log("GPS BACKGROUND CALLBACK:", location, error)
        if (error) {
          if (onErro) onErro()
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