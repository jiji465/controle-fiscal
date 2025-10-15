"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { CalendarView } from "@/components/calendar-view"
import { getObligationsWithDetails, getTaxesDueDates, getInstallmentsWithDetails, runRecurrenceCheckAndGeneration } from "@/lib/dashboard-utils"
import type { CalendarEvent } from "@/lib/types"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarioPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useSupabaseAuth()
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    await runRecurrenceCheckAndGeneration()
    const obligations = await getObligationsWithDetails()
    const taxes = await getTaxesDueDates(6)
    const installments = await getInstallmentsWithDetails()
    const combinedEvents: CalendarEvent[] = [...obligations, ...taxes, ...installments];
    setCalendarEvents(combinedEvents)
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando autenticação...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-[600px] w-full" />
        </main>
      </div>
    )
  }

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