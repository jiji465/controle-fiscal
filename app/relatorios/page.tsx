"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ReportsPanel } from "@/components/reports-panel"
import type { ObligationWithDetails, InstallmentWithDetails, TaxDueDate } from "@/lib/types"
import { getObligations, getClients, getTaxes, getInstallments } from "@/lib/storage"
import { calculateDueDate, calculateTaxDueDate, calculateInstallmentDueDate } from "@/lib/date-utils"
import { getTaxesDueDates, getInstallmentsWithDetails } from "@/lib/dashboard-utils" // Import these for consistency

export default function RelatoriosPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([]) // New state
  const [taxesDueDates, setTaxesDueDates] = useState<TaxDueDate[]>([]) // New state

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const obligationsData = getObligations()
    const clientsData = getClients()
    const taxesData = getTaxes()
    const installmentsData = getInstallments() // Fetch installments

    const obligationsWithDetails: ObligationWithDetails[] = obligationsData.map((obl) => {
      const client = clientsData.find((c) => c.id === obl.clientId)!
      const tax = obl.taxId ? taxesData.find((t) => t.id === obl.taxId) : undefined
      // Corrected arguments for calculateDueDate and converted to ISO string
      const calculatedDueDate = calculateDueDate(
        obl.dueDay,
        obl.dueMonth,
        obl.frequency,
        obl.weekendRule
      ).toISOString()

      return {
        ...obl,
        client,
        tax,
        calculatedDueDate,
        type: "obligation", // Explicitly add the type
        status: obl.status, // Ensure status is explicitly set
      } as ObligationWithDetails
    })

    const allTaxesDueDates: TaxDueDate[] = getTaxesDueDates(6); // Generate for 6 months
    const allInstallmentsWithDetails: InstallmentWithDetails[] = getInstallmentsWithDetails(); // Get installments with details

    setObligations(obligationsWithDetails)
    setInstallments(allInstallmentsWithDetails); // Set installments state
    setTaxesDueDates(allTaxesDueDates); // Set taxesDueDates state
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