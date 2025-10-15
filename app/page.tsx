"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/integrations/supabase/client"
import { Navigation } from "@/components/navigation"
import { DashboardStatsCards } from "@/components/dashboard-stats"
import { ProductivityStats } from "@/components/productivity-stats"
import { UpcomingFiscalEvents } from "@/components/upcoming-fiscal-events"
import { ClientOverview } from "@/components/client-overview"
import { TaxCalendar } from "@/components/tax-calendar"
import { QuickActions } from "@/components/quick-actions"
import { getClients, getTaxes } from "@/lib/storage"
import { getObligationsWithDetails, calculateDashboardStats, getTaxesDueDates, getInstallmentsWithDetails } from "@/lib/dashboard-utils"
import { TrendingUp, CalendarIcon, AlertCircle, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Client, Tax, ObligationWithDetails, DashboardStats, TaxDueDate, InstallmentWithDetails } from "@/lib/types"
import { defaultDashboardStats } from "@/lib/types"
import { isOverdue } from "@/lib/date-utils"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>(defaultDashboardStats)
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [taxesDueDates, setTaxesDueDates] = useState<TaxDueDate[]>([])
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])

  const updateData = async () => {
    setLoading(true)
    const statsData = await calculateDashboardStats()
    const obligationsData = await getObligationsWithDetails()
    const clientsData = await getClients()
    const taxesData = await getTaxesDueDates(6)
    const installmentsData = await getInstallmentsWithDetails()

    setStats(statsData)
    setObligations(obligationsData)
    setClients(clientsData)
    setTaxesDueDates(taxesData)
    setInstallments(installmentsData)
    setLoading(false)
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        updateData()
      }
    }
    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-12 w-1/2" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    )
  }

  const criticalObligationAlerts = obligations.filter(
    (o) => o.status === "overdue" || (o.status === "pending" && isOverdue(o.calculatedDueDate)),
  )
  const criticalInstallmentAlerts = installments.filter(
    (i) => i.status === "overdue" || (i.status === "pending" && isOverdue(i.calculatedDueDate)),
  )
  const criticalTaxAlerts = taxesDueDates.filter(
    (t) => isOverdue(t.calculatedDueDate) && t.status !== "completed",
  );

  const allCriticalAlerts = [...criticalObligationAlerts, ...criticalInstallmentAlerts, ...criticalTaxAlerts].sort(
    (a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime()
  );

  const today = new Date()
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcomingObligationsThisWeek = obligations.filter((o) => {
    const dueDate = new Date(o.calculatedDueDate)
    return dueDate >= today && dueDate <= nextWeek && o.status !== "completed"
  })
  const upcomingInstallmentsThisWeek = installments.filter((i) => {
    const dueDate = new Date(i.calculatedDueDate)
    return dueDate >= today && dueDate <= nextWeek && i.status !== "completed"
  })
  const upcomingTaxesThisWeek = taxesDueDates.filter((t) => {
    const dueDate = new Date(t.calculatedDueDate)
    return dueDate >= today && dueDate <= nextWeek && t.status !== "overdue"
  })

  const allUpcomingThisWeek = [...upcomingObligationsThisWeek, ...upcomingInstallmentsThisWeek, ...upcomingTaxesThisWeek].sort(
    (a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Dashboard Fiscal</h1>
            <p className="text-lg text-muted-foreground">Controle completo de obrigações acessórias, impostos e parcelamentos</p>
          </div>

          {allCriticalAlerts.length > 0 && (
            <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="size-5" />
                  Alertas Críticos
                </CardTitle>
                <CardDescription>Obrigações, impostos ou parcelamentos que requerem atenção imediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allCriticalAlerts.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-muted-foreground">{event.client.name}</p>
                      </div>
                      <Badge className="bg-red-600">
                        {event.type === "obligation" ? "Obrigação Atrasada" : event.type === "tax" ? "Imposto Atrasado" : "Parcelamento Atrasado"}
                      </Badge>
                    </div>
                  ))}
                  {allCriticalAlerts.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{allCriticalAlerts.length - 5} alertas adicionais
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="animate-in">
            <DashboardStatsCards stats={stats} />
          </div>

          {allUpcomingThisWeek.length > 0 && (
            <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <CalendarIcon className="size-5" />
                  Vencendo nos Próximos 7 Dias
                </CardTitle>
                <CardDescription>{allUpcomingThisWeek.length} eventos requerem atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {allUpcomingThisWeek.slice(0, 6).map((event) => (
                    <div key={event.id} className="p-3 bg-background rounded-lg border">
                      <p className="font-medium text-sm">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.client.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Vence: {new Date(event.calculatedDueDate).toLocaleDateString("pt-BR")}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {event.type === "obligation" ? "Obrigação" : event.type === "tax" ? "Imposto" : "Parcelamento"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <QuickActions obligations={obligations} installments={installments} onUpdate={updateData} />

          <TaxCalendar taxes={taxesDueDates} />

          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="size-6" />
              Indicadores de Produtividade
            </h2>
            <ProductivityStats obligations={obligations} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <UpcomingFiscalEvents obligations={obligations} installments={installments} taxesDueDates={taxesDueDates} />
            <ClientOverview clients={clients} obligations={obligations} installments={installments} />
          </div>
        </div>
      </main>
    </div>
  )
}