"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { TaxForm } from "@/components/tax-form"
import { TaxList } from "@/components/tax-list"
import { GlobalSearch } from "@/components/global-search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getTaxes, getClients, getInstallments, saveTax } from "@/lib/storage"
import { getObligationsWithDetails, getInstallmentsWithDetails, getTaxesDueDates } from "@/lib/dashboard-utils"
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  Search,
  Plus,
} from "lucide-react"
import type { Tax, Client, ObligationWithDetails, InstallmentWithDetails, TaxDueDate } from "@/lib/types"
import { isOverdue } from "@/lib/date-utils"

export default function ImpostosPage() {
  const [taxTemplates, setTaxTemplates] = useState<Tax[]>([])
  const [taxesDueDates, setTaxesDueDates] = useState<TaxDueDate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [editingTaxTemplate, setEditingTaxTemplate] = useState<Tax | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchOpen, setSearchOpen] = useState(false)

  const updateData = () => {
    setTaxTemplates(getTaxes())
    setClients(getClients())
    setObligations(getObligationsWithDetails())
    setInstallments(getInstallmentsWithDetails())
    setTaxesDueDates(getTaxesDueDates(6))
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

  const handleSaveTaxTemplate = (tax: Tax) => {
    saveTax(tax);
    updateData()
    setEditingTaxTemplate(undefined)
    setIsFormOpen(false)
  }

  const handleNewTaxTemplate = () => {
    setEditingTaxTemplate(undefined)
    setIsFormOpen(true)
  }

  const handleEditTaxTemplate = (tax: Tax) => {
    setEditingTaxTemplate(tax)
    setIsFormOpen(true)
  }

  const pendingTaxes = taxesDueDates.filter((t) => t.status === "pending")
  const inProgressTaxes = taxesDueDates.filter((t) => t.status === "in_progress")
  const processedTaxes = taxesDueDates.filter((t) => t.status === "completed")
  const overdueTaxes = taxesDueDates.filter((t) => isOverdue(t.calculatedDueDate) && t.status !== "completed")

  const getFilteredTaxesDueDates = () => {
    switch (activeTab) {
      case "pending":
        return pendingTaxes
      case "in_progress":
        return inProgressTaxes
      case "completed":
        return processedTaxes
      case "overdue":
        return overdueTaxes
      default:
        return taxesDueDates
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-balance">Impostos</h1>
              <p className="text-lg text-muted-foreground">Gerencie todos os impostos e seus vencimentos</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSearchOpen(true)} className="gap-2">
                <Search className="size-4" />
                Buscar
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Button onClick={handleNewTaxTemplate}>
                <Plus className="size-4 mr-2" />
                Novo Imposto
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="all" className="flex flex-col gap-1 py-3">
                <span className="text-sm font-medium">Todos</span>
                <Badge variant="secondary" className="text-xs">
                  {taxesDueDates.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span className="text-sm font-medium">Pendentes</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pendingTaxes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <PlayCircle className="size-3.5" />
                  <span className="text-sm font-medium">Em Processamento</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {inProgressTaxes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span className="text-sm font-medium">Processados</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                >
                  {processedTaxes.length}
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
                  {overdueTaxes.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <Card className="p-6">
                <TaxList
                  taxesDueDates={getFilteredTaxesDueDates()}
                  clients={clients}
                  taxTemplates={taxTemplates}
                  onUpdate={updateData}
                  onEdit={handleEditTaxTemplate}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <TaxForm
        tax={editingTaxTemplate}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTaxTemplate}
        clients={clients}
      />
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        clients={clients}
        taxes={taxTemplates}
        obligations={obligations}
        installments={installments}
      />
    </div>
  )
}