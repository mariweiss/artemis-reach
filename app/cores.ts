export const coresClaro = {
  fundo: "#EEEAF8",
  fundoCard: "#F5F2FC",
  roxo: "#5A4997",
  roxoEscuro: "#2F195F",
  roxoClaro: "#BB99FF",
  lavanda: "#8575BD",
  amarelo: "#FDEA72",
  branco: "#FFFFFF",
  texto: "#2F195F",
  textoSecundario: "#8575BD",
  borda: "rgba(90,73,151,0.15)",
  sombra: "rgba(90,73,151,0.1)",
}

export const coresEscuro = {
  fundo: "#1a0f2e",
  fundoCard: "#2F195F",
  roxo: "#BB99FF",
  roxoEscuro: "#BB99FF",
  roxoClaro: "#9b7ee8",
  lavanda: "#a899cc",
  amarelo: "#FDEA72",
  branco: "#2F195F",
  texto: "#f8f6ff",
  textoSecundario: "#a899cc",
  borda: "rgba(187,153,255,0.2)",
  sombra: "rgba(0,0,0,0.3)",
}

export function getCores(isDark: boolean) {
  return isDark ? coresEscuro : coresClaro
}