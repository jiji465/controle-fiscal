"use client"

import { useEffect, useState, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { ReportsPanel } from "@/components/reports-panel"
import type { ObligationWithDetails, InstallmentWithDetails, TaxDueDate } from "@/lib/types"
import { getObligationsWithDetails, getTaxesDueDates, getInstallmentsWithDetails, runRecurrenceCheckAndGeneration } from "@/lib/dashboard-utils"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function RelatoriosPage() {
  const { isAuthenticated, isLoading: isAuthLoading, router } = useSupabaseAuth()
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [taxesDueDates, setTaxesDueDates] = useState<TaxDueDate[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    await runRecurrenceCheckAndGeneration()
    const [obligationsData, installmentsData, taxesData] = await Promise.all([
      getObligationsWithDetails(),
      getInstallmentsWithDetails(),
      getTaxesDueDates(12),
    ])
    setObligations(obligationsData)
    setInstallments(installmentsData)
    setTaxesDueDates(taxesData)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    loadData()
  }, [isAuthenticated, isAuthLoading, router, loadData])

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-[800px] w-full" />
        </main>
      </div>
    )
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