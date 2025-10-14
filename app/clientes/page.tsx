"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ClientList } from "@/components/client-list"
import { getClients } from "@/lib/storage"

export default function ClientesPage() {
  const [clients, setClients] = useState(getClients())

  const handleUpdate = () => {
    setClients(getClients())
  }

  useEffect(() => {
    handleUpdate()
  }, [])

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
