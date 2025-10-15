"use client"

import { useEffect, useState, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { ClientList } from "@/components/client-list"
import { getClients } from "@/lib/storage"
import type { Client } from "@/lib/types"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientesPage() {
  const { isAuthenticated, isLoading: isAuthLoading, router } = useSupabaseAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const handleUpdate = useCallback(async () => {
    setLoading(true)
    const clientsData = await getClients()
    setClients(clientsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    handleUpdate()
  }, [isAuthenticated, isAuthLoading, router, handleUpdate])

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-[500px] w-full" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground mt-2">Gerencie os clientes e suas informações</p>
          </div>

          <ClientList clients={clients} onUpdate={handleUpdate} />
        </div>
      </main>
    </div>
  )
}