"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { CalendarView } from "@/components/calendar-view"
import { getObligationsWithDetails, getTaxesDueDates, getInstallmentsWithDetails } from "@/lib/dashboard-utils"
import type { CalendarEvent } from "@/lib/types"

export default function CalendarioPage() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    const obligations = getObligationsWithDetails()
    const taxes = getTaxesDueDates(6) // Generate tax due dates for 6 months ahead
    const installments = getInstallmentsWithDetails()
    const combinedEvents: CalendarEvent[] = [...obligations, ...taxes, ...installments];
    setCalendarEvents(combinedEvents)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
            <p className="text-muted-foreground mt-2">Visualize os vencimentos das obrigações, impostos e parcelamentos no calendário</p>
          </div>

          <CalendarView events={calendarEvents} />
        </div>
      </main>
    </div>
  )
}