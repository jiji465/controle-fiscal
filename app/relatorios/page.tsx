"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ReportsPanel } from "@/components/reports-panel"
import type { ObligationWithDetails } from "@/lib/types"
import { getObligations, getClients, getTaxes } from "@/lib/storage"
import { calculateDueDate } from "@/lib/date-utils"

export default function RelatoriosPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const obligationsData = getObligations()
    const clientsData = getClients()
    const taxesData = getTaxes()

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
      }
    })

    setObligations(obligationsWithDetails)
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

          <ReportsPanel obligations={obligations} />
        </div>
      </main>
    </div>
  )
}