"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { InstallmentList } from "@/components/installment-list"
import { GlobalSearch } from "@/components/global-search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getClients, getTaxes } from "@/lib/storage"
import { getObligationsWithDetails, getInstallmentsWithDetails } from "@/lib/dashboard-utils"
import { isOverdue } from "@/lib/date-utils"
import { CheckCircle2, Clock, PlayCircle, AlertTriangle, Search } from "lucide-react"
import type { Client, Tax, ObligationWithDetails, InstallmentWithDetails } from "@/lib/types"

export default function ParcelamentosPage() {
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [searchOpen, setSearchOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const updateData = async () => {
    setLoading(true)
    const [installmentsData, clientsData, taxesData, obligationsData] = await Promise.all([
      getInstallmentsWithDetails(),
      getClients(),
      getTaxes(),
      getObligationsWithDetails(),
    ])
    setInstallments(installmentsData)
    setClients(clientsData)
    setTaxes(taxesData)
    setObligations(obligationsData)
    setLoading(false)
  }

  useEffect(() => {
    updateData()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const pendingInstallments = installments.filter((i) => i.status === "pending")
  const inProgressInstallments = installments.filter((i) => i.status === "in_progress")
  const completedInstallments = installments.filter((i) => i.status === "completed")
  const overdueInstallments = installments.filter((i) => isOverdue(i.calculatedDueDate) && i.status !== "completed")

  const getFilteredInstallments = () => {
    switch (activeTab) {
      case "pending":
        return pendingInstallments
      case "in_progress":
        return inProgressInstallments
      case "completed":
        return completedInstallments
      case "overdue":
        return overdueInstallments
      default:
        return installments
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-balance">Parcelamentos</h1>
              <p className="text-lg text-muted-foreground">Gerencie todos os parcelamentos fiscais dos seus clientes</p>
            </div>
            <Button variant="outline" onClick={() => setSearchOpen(true)} className="gap-2">
              <Search className="size-4" />
              Buscar
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="all" className="flex flex-col gap-1 py-3">
                <span className="text-sm font-medium">Todos</span>
                <Badge variant="secondary" className="text-xs">
                  {installments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span className="text-sm font-medium">Pendentes</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pendingInstallments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <PlayCircle className="size-3.5" />
                  <span className="text-sm font-medium">Em Andamento</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {inProgressInstallments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span className="text-sm font-medium">Concluídos</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                >
                  {completedInstallments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  <span className="text-sm font-medium">Atrasados</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                >
                  {overdueInstallments.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <Card className="p-6">
                {loading ? (
                  <p>Carregando parcelamentos...</p>
                ) : (
                  <InstallmentList
                    installments={getFilteredInstallments()}
                    clients={clients}
                    onUpdate={updateData}
                  />
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        clients={clients}
        taxes={taxes}
        obligations={obligations}
        installments={installments}
      />
    </div>
  )
}