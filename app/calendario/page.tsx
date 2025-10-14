"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { CalendarView } from "@/components/calendar-view"
import { getObligationsWithDetails } from "@/lib/dashboard-utils"

export default function CalendarioPage() {
  const [obligations, setObligations] = useState(getObligationsWithDetails())

  useEffect(() => {
    setObligations(getObligationsWithDetails())
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
            <p className="text-muted-foreground mt-2">Visualize os vencimentos das obrigações no calendário</p>
          </div>

          <CalendarView obligations={obligations} />
        </div>
      </main>
    </div>
  )
}
