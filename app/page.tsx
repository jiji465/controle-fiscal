"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { DashboardStatsCards } from "@/components/dashboard-stats"
import { ProductivityStats } from "@/components/productivity-stats"
import { UpcomingObligations } from "@/components/upcoming-obligations"
import { ClientOverview } from "@/components/client-overview"
import { TaxCalendar } from "@/components/tax-calendar"
import { QuickActions } from "@/components/quick-actions"
import { getClients, getTaxes } from "@/lib/storage"
import { getObligationsWithDetails, calculateDashboardStats } from "@/lib/dashboard-utils"
import { TrendingUp, CalendarIcon, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const [stats, setStats] = useState(calculateDashboardStats())
  const [obligations, setObligations] = useState(getObligationsWithDetails())
  const [clients, setClients] = useState(getClients())
  const [taxes, setTaxes] = useState(getTaxes())

  const updateData = () => {
    setStats(calculateDashboardStats())
    setObligations(getObligationsWithDetails())
    setClients(getClients())
    setTaxes(getTaxes())
  }

  useEffect(() => {
    updateData()
  }, [])

  const criticalAlerts = obligations.filter(
    (o) => o.status === "overdue" || (o.status === "pending" && new Date(o.calculatedDueDate) <= new Date()),
  )

  const thisWeekObligations = obligations.filter((o) => {
    const dueDate = new Date(o.calculatedDueDate)
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return dueDate >= today && dueDate <= nextWeek && o.status !== "completed"
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Dashboard Fiscal</h1>
            <p className="text-lg text-muted-foreground">Controle completo de obrigações acessórias e impostos</p>
          </div>

          {criticalAlerts.length > 0 && (
            <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="size-5" />
                  Alertas Críticos
                </CardTitle>
                <CardDescription>Obrigações que requerem atenção imediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criticalAlerts.slice(0, 5).map((obl) => (
                    <div key={obl.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div>
                        <p className="font-medium">{obl.name}</p>
                        <p className="text-sm text-muted-foreground">{obl.client.name}</p>
                      </div>
                      <Badge className="bg-red-600">{obl.status === "overdue" ? "Atrasada" : "Vence hoje"}</Badge>
                    </div>
                  ))}
                  {criticalAlerts.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{criticalAlerts.length - 5} alertas adicionais
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="animate-in">
            <DashboardStatsCards stats={stats} />
          </div>

          {thisWeekObligations.length > 0 && (
            <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <CalendarIcon className="size-5" />
                  Vencendo nos Próximos 7 Dias
                </CardTitle>
                <CardDescription>{thisWeekObligations.length} obrigações requerem atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {thisWeekObligations.slice(0, 6).map((obl) => (
                    <div key={obl.id} className="p-3 bg-background rounded-lg border">
                      <p className="font-medium text-sm">{obl.name}</p>
                      <p className="text-xs text-muted-foreground">{obl.client.name}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Vence: {new Date(obl.calculatedDueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <QuickActions obligations={obligations} onUpdate={updateData} />

          <TaxCalendar taxes={taxes} />

          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="size-6" />
              Indicadores de Produtividade
            </h2>
            <ProductivityStats obligations={obligations} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <UpcomingObligations obligations={obligations} />
            <ClientOverview clients={clients} obligations={obligations} />
          </div>
        </div>
      </main>
    </div>
  )
}
