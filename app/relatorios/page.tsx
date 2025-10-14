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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [obligationsData, installmentsData, taxesData] = await Promise.all([
        getObligationsWithDetails(),
        getInstallmentsWithDetails(),
        getTaxesDueDates(12),
      ])
      setObligations(obligationsData)
      setInstallments(installmentsData)
      setTaxesDueDates(taxesData)
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Relatórios</h1>
            <p className="text-lg text-muted-foreground">Análise detalhada de obrigações fiscais e produtividade</p>
          </div>

          {loading ? (
            <p>Carregando relatórios...</p>
          ) : (
            <ReportsPanel obligations={obligations} installments={installments} taxesDueDates={taxesDueDates} />
          )}
        </div>
      </main>
    </div>
  )
}