"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation" // Importando useRouter
import { Navigation } from "@/components/navigation"
import { ObligationList } from "@/components/obligation-list"
import { ObligationCardView } from "@/components/obligation-card-view"
import { ObligationKanban } from "@/components/obligation-kanban"
import { ObligationForm } from "@/components/obligation-form"
import { ObligationDetails } from "@/components/obligation-details"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { List, LayoutGrid, Kanban, Plus, Download } from "lucide-react"
import { getClients, getTaxes, saveObligation, deleteObligation } from "@/lib/storage"
import { getObligationsWithDetails, runRecurrenceCheckAndGeneration } from "@/lib/dashboard-utils"
import type { Client, Tax, ObligationWithDetails, Obligation } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportDialog } from "@/components/export-dialog"
import { toast } from "@/hooks/use-toast"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

export default function ObligationsPage() {
  const router = useRouter() // Inicializando useRouter
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth()
  const [loading, setLoading] = useState(true)
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingObligation, setEditingObligation] = useState<ObligationWithDetails | undefined>()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [viewingObligation, setViewingObligation] = useState<ObligationWithDetails | undefined>()
  const [isExportOpen, setIsExportOpen] = useState(false)

  const updateData = useCallback(async () => {
    setLoading(true)
    // Executa a verificação de recorrência antes de carregar os dados
    await runRecurrenceCheckAndGeneration()
    
    const obligationsData = await getObligationsWithDetails()
    const clientsData = await getClients()
    const taxesData = await getTaxes()

    setObligations(obligationsData)
    setClients(clientsData)
    setTaxes(taxesData)
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

  const handleSave = async (obligation: Obligation) => {
    try {
      await saveObligation(obligation)
      await updateData()
      setEditingObligation(undefined)
      setIsFormOpen(false)
      toast({
        title: "Obrigação salva!",
        description: `A obrigação "${obligation.name}" foi salva com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao salvar obrigação:", error)
      toast({
        title: "Erro ao salvar obrigação",
        description: error instanceof Error ? error.message : "Não foi possível salvar a obrigação.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleEdit = (obligation: ObligationWithDetails) => {
    setEditingObligation(obligation)
    setIsFormOpen(true)
  }

  const handleNew = () => {
    setEditingObligation(undefined)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("⚠️ Tem certeza que deseja excluir esta obrigação?\n\nEsta ação não pode ser desfeita.")) {
      try {
        await deleteObligation(id)
        await updateData()
        toast({
          title: "Obrigação excluída!",
          description: "A obrigação foi removida com sucesso.",
          variant: "destructive",
        })
      } catch (error) {
        console.error("Erro ao excluir obrigação:", error)
        toast({
          title: "Erro ao excluir obrigação",
          description: error instanceof Error ? error.message : "Não foi possível excluir a obrigação.",
          variant: "destructive",
        })
      }
    }
  }

  const handleView = (obligation: ObligationWithDetails) => {
    setViewingObligation(obligation)
    setIsDetailsOpen(true)
  }

  const handleComplete = async (obligation: ObligationWithDetails) => {
    const history = obligation.history || []
    const completedDate = new Date().toISOString()
    const updated = {
      ...obligation,
      status: "completed" as const,
      completedAt: completedDate,
      realizationDate: completedDate.split("T")[0],
      completedBy: "Contador",
      history: [
        ...history,
        {
          id: crypto.randomUUID(),
          action: "completed" as const,
          description: `Obrigação concluída em ${new Date().toLocaleDateString("pt-BR")}`,
          timestamp: completedDate,
        },
      ],
    }
    const { client: _client, tax: _tax, ...rest } = updated
    const obligationToSave: Obligation = { ...rest }
    try {
      await saveObligation(obligationToSave)
      await updateData()
      toast({
        title: "Obrigação concluída!",
        description: `A obrigação "${obligation.name}" foi marcada como concluída.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao concluir obrigação:", error)
      toast({
        title: "Erro ao concluir obrigação",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a obrigação.",
        variant: "destructive",
      })
    }
  }

  const handleInProgress = async (obligation: ObligationWithDetails) => {
    const history = obligation.history || []
    const updated = {
      ...obligation,
      status: "in_progress" as const,
      history: [
        ...history,
        {
          id: crypto.randomUUID(),
          action: "status_changed" as const,
          description: "Status alterado para Em Andamento",
          timestamp: new Date().toISOString(),
        },
      ],
    }
    const { client: _client, tax: _tax, ...rest } = updated
    const obligationToSave: Obligation = { ...rest }
    try {
      await saveObligation(obligationToSave)
      await updateData()
      toast({
        title: "Obrigação em andamento!",
        description: `A obrigação "${obligation.name}" foi marcada como em andamento.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao atualizar obrigação:", error)
      toast({
        title: "Erro ao atualizar obrigação",
        description: error instanceof Error ? error.message : "Não foi possível atualizar a obrigação.",
        variant: "destructive",
      })
    }
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
            <h1 className="text-3xl font-bold">Obrigações Acessórias</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsExportOpen(true)}>
                <Download className="size-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={handleNew}>
                <Plus className="size-4 mr-2" />
                Nova Obrigação
              </Button>
            </div>
          </div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list">
                <List className="size-4 mr-2" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="cards">
                <LayoutGrid className="size-4 mr-2" />
                Cartões
              </TabsTrigger>
              <TabsTrigger value="kanban">
                <Kanban className="size-4 mr-2" />
                Kanban
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              <ObligationList
                obligations={obligations}
                clients={clients}
                taxes={taxes}
                onUpdate={updateData}
              />
            </TabsContent>

            <TabsContent value="cards" className="mt-4">
              <ObligationCardView
                obligations={obligations}
                onComplete={handleComplete}
                onInProgress={handleInProgress}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            </TabsContent>

            <TabsContent value="kanban" className="mt-4">
              <ObligationKanban
                obligations={obligations}
                clients={clients}
                taxes={taxes}
                onUpdate={updateData}
                onEdit={handleEdit}
                onView={handleView}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ObligationForm
        obligation={editingObligation}
        clients={clients}
        taxes={taxes}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
      />

      {viewingObligation && (
        <ObligationDetails obligation={viewingObligation} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      )}

      <ExportDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        obligations={obligations}
        clients={clients}
      />
    </div>
  )
}