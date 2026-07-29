"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  tema: Theme
  toggleTema: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  tema: "light",
  toggleTema: () => {},
  isDark: false
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Theme>("light")
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
    try {
      const salvo = localStorage.getItem("artemis-tema") as Theme
      if (salvo === "dark" || salvo === "light") setTema(salvo)
    } catch {}
  }, [])

  function toggleTema() {
    const novo: Theme = tema === "light" ? "dark" : "light"
    setTema(novo)
    try {
      localStorage.setItem("artemis-tema", novo)
    } catch {}
  }

  return (
    <ThemeContext.Provider value={{ tema, toggleTema, isDark: montado && tema === "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTema() {
  return useContext(ThemeContext)
}