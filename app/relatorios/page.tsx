"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ReportsPanel } from "@/components/reports-panel"
import type { ObligationWithDetails, InstallmentWithDetails, TaxDueDate } from "@/lib/types"
import { getObligationsWithDetails, getTaxesDueDates, getInstallmentsWithDetails } from "@/lib/dashboard-utils"

export default function RelatoriosPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [taxesDueDates, setTaxesDueDates] = useState<TaxDueDate[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setObligations(getObligationsWithDetails())
    setInstallments(getInstallmentsWithDetails())
    setTaxesDueDates(getTaxesDueDates(12)) // Load for 12 months for better reporting
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Relatórios</h1>
            <p className="text-lg text-muted-foreground">Análise detalhada de obrigações fiscais e produtividade</p>
          </div>

          <ReportsPanel obligations={obligations} installments={installments} taxesDueDates={taxesDueDates} />
        </div>
      </main>
    </div>
  )
}