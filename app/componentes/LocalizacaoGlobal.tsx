"use client"

import { useLocalizacao } from "../hooks/useLocalizacao"
import { usePushNotifications } from "../hooks/usePushNotifications"

export default function LocalizacaoGlobal() {
  useLocalizacao()
  usePushNotifications()
  return null
}