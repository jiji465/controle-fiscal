"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { useNotifications } from "@/hooks/use-notifications"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme()
  // Apenas chama o hook para inicializar o estado global de notificações
  useNotifications() 

  useEffect(() => {
    // Define o tema padrão como 'system' se ainda não estiver definido
    if (!theme) {
      setTheme('system')
    }
    // A lógica de carregamento de notificações agora está dentro do useNotifications
  }, [setTheme, theme])

  return (
    <>
      {children}
      <Toaster />
    </>
  )
}