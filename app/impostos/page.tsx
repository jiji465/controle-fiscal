"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation" // Importando useRouter
import { Navigation } from "@/components/navigation"
import { TaxList } from "@/components/tax-list"
import { TaxForm } from "@/components/tax-form"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { getClients, getTaxes, saveTax } from "@/lib/storage"
import { getTaxesDueDates, runRecurrenceCheckAndGeneration } from "@/lib/dashboard-utils"
import type { Client, Tax, TaxDueDate } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

export default function TaxesPage() {
  const router = useRouter() // Inicializando useRouter
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth()
  const [loading, setLoading] = useState(true)
  const [taxesDueDates, setTaxesDueDates] = useState<TaxDueDate[]>([])
  const [taxTemplates, setTaxTemplates] = useState<Tax[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTax, setEditingTax] = useState<Tax | undefined>()

  const updateData = useCallback(async () => {
    setLoading(true)
    // Executa a verificação de recorrência antes de carregar os dados
    await runRecurrenceCheckAndGeneration()
    
    const clientsData = await getClients()
    const taxTemplatesData = await getTaxes()
    const taxesDueDatesData = await getTaxesDueDates(12) // Carrega 12 meses de datas de vencimento

    setClients(clientsData)
    setTaxTemplates(taxTemplatesData)
    setTaxesDueDates(taxesDueDatesData)
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

  const handleSave = (tax: Tax) => {
    saveTax(tax)
    updateData()
    setEditingTax(undefined)
    setIsFormOpen(false)
    toast({
      title: "Imposto salvo!",
      description: `O imposto "${tax.name}" foi salvo com sucesso.`,
    });
  }

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax)
    setIsFormOpen(true)
  }

  const handleNew = () => {
    setEditingTax(undefined)
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
            <h1 className="text-3xl font-bold">Impostos e Tributos</h1>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                <Download className="size-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleNew}>
                <Plus className="size-4 mr-2" />
                Novo Imposto
              </Button>
            </div>
          </div>

          <TaxList
            taxesDueDates={taxesDueDates}
            clients={clients}
            taxTemplates={taxTemplates}
            onUpdate={updateData}
            onEdit={handleEdit}
          />
        </div>
      </main>

      <TaxForm
        tax={editingTax}
        clients={clients}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
      />
    </div>
  )
}