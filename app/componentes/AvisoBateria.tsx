"use client"

import { useState, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Battery, X } from "lucide-react"
import { useTema } from "../contexts/ThemeContext"
import { getCores } from "../cores"

export default function AvisoBateria() {
  const { isDark } = useTema()
  const cores = getCores(isDark)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    // Só mostra no app nativo
    if (!Capacitor.isNativePlatform()) return

    // Verifica se já foi dispensado antes
    try {
      const dispensado = localStorage.getItem("aviso-bateria-dispensado")
      if (!dispensado) setMostrar(true)
    } catch {
      setMostrar(true)
    }
  }, [])

  function dispensar() {
    setMostrar(false)
    try {
      localStorage.setItem("aviso-bateria-dispensado", "true")
    } catch { }
  }

  async function abrirConfiguracoes() {
    try {
      const { AppLauncher } = await import("@capacitor/app-launcher")
      // Abre direto as configurações de otimização de bateria do Android
      await AppLauncher.openUrl({
        url: "intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end"
      })
    } catch {
      try {
        const { AppLauncher } = await import("@capacitor/app-launcher")
        await AppLauncher.openUrl({ url: "package:com.artemis.reach" })
      } catch { }
    }
    dispensar()
  }

  if (!mostrar) return null

  return (
    <div style={{
      position: "fixed", bottom: "80px", left: "16px", right: "16px",
      backgroundColor: cores.branco, borderRadius: "16px",
      padding: "16px", zIndex: 2000,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      border: `1.5px solid ${cores.amarelo}`
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          backgroundColor: "rgba(253,234,114,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0
        }}>
          <Battery size={22} color={cores.roxo} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: "700", color: cores.texto }}>
            Mantenha sua proteção ativa
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: cores.textoSecundario, lineHeight: "1.5" }}>
            Para que sua localização continue sendo compartilhada mesmo com o app fechado, desative a otimização de bateria do Artemis nas configurações do celular.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={abrirConfiguracoes} style={{
              flex: 1, padding: "10px", borderRadius: "10px",
              backgroundColor: cores.roxo, color: isDark ? cores.fundo : "white",
              border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer"
            }}>
              Abrir configurações
            </button>
            <button onClick={dispensar} style={{
              padding: "10px 16px", borderRadius: "10px",
              backgroundColor: "transparent", color: cores.textoSecundario,
              border: `1px solid ${cores.borda}`, fontSize: "13px", cursor: "pointer"
            }}>
              Depois
            </button>
          </div>
        </div>
        <button onClick={dispensar} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <X size={18} color={cores.textoSecundario} />
        </button>
      </div>
    </div>
  )
}