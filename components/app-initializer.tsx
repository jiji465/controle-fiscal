"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { useNotifications } from "@/hooks/use-notifications"

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const { initializeNotifications } = useNotifications()

  useEffect(() => {
    // Define o tema padrão como 'system' se não estiver definido
    setTheme('system')
    initializeNotifications()
  }, [setTheme, initializeNotifications])

  return (
    <>
      {children}
      <Toaster />
    </>
  )
}