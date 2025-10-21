"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation" // Importando useRouter
import { Navigation } from "@/components/navigation"
import { InstallmentList } from "@/components/installment-list"
import { InstallmentForm } from "@/components/installment-form"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { getClients, saveInstallment } from "@/lib/storage"
import { getInstallmentsWithDetails, runRecurrenceCheckAndGeneration } from "@/lib/dashboard-utils"
import type { Client, InstallmentWithDetails, Installment } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

export default function InstallmentsPage() {
  const router = useRouter() // Inicializando useRouter
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth()
  const [loading, setLoading] = useState(true)
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<InstallmentWithDetails | undefined>()

  const updateData = useCallback(async () => {
    setLoading(true)
    // Executa a verificação de recorrência antes de carregar os dados
    await runRecurrenceCheckAndGeneration()
    
    const installmentsData = await getInstallmentsWithDetails()
    const clientsData = await getClients()

    setInstallments(installmentsData)
    setClients(clientsData)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    updateData()
  }, [isAuthenticated, isAuthLoading, router, updateData])

  const handleSave = async (installment: Installment) => {
    try {
      await saveInstallment(installment)
      await updateData()
      setEditingInstallment(undefined)
      setIsFormOpen(false)
      toast({
        title: "Parcelamento salvo!",
        description: `O parcelamento "${installment.name}" foi salvo com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao salvar parcelamento:", error)
      toast({
        title: "Erro ao salvar parcelamento",
        description: error instanceof Error ? error.message : "Não foi possível salvar o parcelamento.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleNew = () => {
    setEditingInstallment(undefined)
    setIsFormOpen(true)
  }

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-10 w-full" />
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Parcelamentos</h1>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                <Download className="size-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleNew}>
                <Plus className="size-4 mr-2" />
                Novo Parcelamento
              </Button>
            </div>
          </div>

          <InstallmentList
            installments={installments}
            clients={clients}
            onUpdate={updateData}
          />
        </div>
      </main>

      <InstallmentForm
        installment={editingInstallment}
        clients={clients}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
      />
    </div>
  )
}