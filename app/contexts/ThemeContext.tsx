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

  useEffect(() => {
    const salvo = localStorage.getItem("artemis-tema") as Theme
    if (salvo) setTema(salvo)
  }, [])

  function toggleTema() {
    const novo: Theme = tema === "light" ? "dark" : "light"
    setTema(novo)
    localStorage.setItem("artemis-tema", novo)
  }

  return (
    <ThemeContext.Provider value={{ tema, toggleTema, isDark: tema === "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTema() {
  return useContext(ThemeContext)
}