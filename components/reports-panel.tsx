"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, AlertTriangle, Calendar, TrendingUp, Users, BarChart3, PieChart, LayoutDashboard, DollarSign } from "lucide-react"
import type { ObligationWithDetails, InstallmentWithDetails, TaxDueDate, FiscalEventType } from "@/lib/types" // Import FiscalEventType
import { formatDate } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"
import { useState, useMemo } from "react"
import { calculateProductivityMetrics } from "@/lib/metrics" // Import calculateProductivityMetrics

type ReportsPanelProps = {
  obligations: ObligationWithDetails[]
  installments: InstallmentWithDetails[] // New prop for installments
  taxesDueDates: TaxDueDate[] // New prop for tax due dates
}

export function ReportsPanel({ obligations, installments, taxesDueDates }: ReportsPanelProps) {
  const [periodFilter, setPeriodFilter] = useState<string>("all")

  const allFiscalEvents = useMemo(() => {
    return [...obligations, ...installments, ...taxesDueDates];
  }, [obligations, installments, taxesDueDates]);

  const filteredEvents = useMemo(() => {
    return allFiscalEvents.filter((event) => {
      const eventDate = new Date(event.calculatedDueDate)
      const now = new Date()

      switch (periodFilter) {
        case "this_month":
          return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
        case "last_month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          return eventDate.getMonth() === lastMonth.getMonth() && eventDate.getFullYear() === lastMonth.getFullYear()
        case "this_quarter":
          const quarter = Math.floor(now.getMonth() / 3)
          const eventQuarter = Math.floor(eventDate.getMonth() / 3)
          return eventQuarter === quarter && eventDate.getFullYear() === now.getFullYear()
        case "this_year":
          return eventDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }, [allFiscalEvents, periodFilter]);

  // Metrics for obligations only for now, as productivity is more tied to them
  const metrics = useMemo(() => calculateProductivityMetrics(obligations), [obligations]);

  const completedObligations = filteredEvents.filter((e) => e.type === "obligation" && e.status === "completed") as ObligationWithDetails[];
  const completedInstallments = filteredEvents.filter((e) => e.type === "installment" && e.status === "completed") as InstallmentWithDetails[];
  const inProgressObligations = filteredEvents.filter((e) => e.type === "obligation" && e.status === "in_progress") as ObligationWithDetails[];
  const pendingObligations = filteredEvents.filter((e) => e.type === "obligation" && e.status === "pending") as ObligationWithDetails[];
  const pendingInstallments = filteredEvents.filter((e) => e.type === "installment" && e.status === "pending") as InstallmentWithDetails[];
  const pendingTaxes = filteredEvents.filter((e) => e.type === "tax" && e.status === "pending") as TaxDueDate[];
  const overdueEvents = filteredEvents.filter((e) => e.status === "overdue");

  const totalCompletedOrPaid = completedObligations.length + completedInstallments.length;
  const totalEventsConsidered = filteredEvents.length;

  const completionRate =
    totalEventsConsidered > 0 ? Math.round((totalCompletedOrPaid / totalEventsConsidered) * 100) : 0

  const completedObligationsOnTime = completedObligations.filter((obl) => {
    if (!obl.realizationDate) return false
    return new Date(obl.realizationDate) <= new Date(obl.calculatedDueDate)
  })
  const completedInstallmentsOnTime = completedInstallments.filter((inst) => {
    if (!inst.completedAt) return false;
    return new Date(inst.completedAt) <= new Date(inst.calculatedDueDate);
  });

  const totalCompletedOnTime = completedObligationsOnTime.length + completedInstallmentsOnTime.length;
  const totalCompletedAndPaid = completedObligations.length + completedInstallments.length;
  const onTimeRate = totalCompletedAndPaid > 0 ? Math.round((totalCompletedOnTime / totalCompletedAndPaid) * 100) : 0;

  // Events by client
  const byClient = filteredEvents.reduce(
    (acc, event) => {
      const clientName = event.client.name
      if (!acc[clientName]) {
        acc[clientName] = { total: 0, completed: 0, pending: 0, inProgress: 0, paid: 0, overdue: 0 }
      }
      acc[clientName].total++
      if (event.type === "obligation") {
        if (event.status === "completed") acc[clientName].completed++;
        if (event.status === "pending") acc[clientName].pending++;
        if (event.status === "in_progress") acc[clientName].inProgress++;
      } else if (event.type === "installment") {
        if (event.status === "completed") acc[clientName].completed++;
        if (event.status === "pending") acc[clientName].pending++;
      } else if (event.type === "tax") {
        if (event.status === "pending") acc[clientName].pending++;
      }
      if (event.status === "overdue") acc[clientName].overdue++;
      return acc
    },
    {} as Record<string, { total: number; completed: number; pending: number; inProgress: number; paid: number; overdue: number }>,
  )

  // Events by type
  const byType = filteredEvents.reduce(
    (acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    },
    {} as Record<FiscalEventType, number>
  );

  // Events by recurrence (for obligations and installments)
  const byRecurrence = filteredEvents.reduce(
    (acc, event) => {
      if (event.type === "obligation" || event.type === "installment") {
        const recurrence = getRecurrenceDescription(event);
        acc[recurrence] = (acc[recurrence] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  )

  // Events by tax (for obligations)
  const byTax = filteredEvents.reduce(
    (acc, event) => {
      if (event.type === "obligation") {
        const taxName = (event as ObligationWithDetails).tax?.name || "Sem imposto"
        if (!acc[taxName]) {
          acc[taxName] = { total: 0, completed: 0 }
        }
        acc[taxName].total++
        if (event.status === "completed") acc[taxName].completed++
      }
      return acc
    },
    {} as Record<string, { total: number; completed: number }>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Desempenho</h2>
          <p className="text-muted-foreground">Métricas e indicadores de produtividade</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="this_month">Este mês</SelectItem>
            <SelectItem value="last_month">Mês passado</SelectItem>
            <SelectItem value="this_quarter">Este trimestre</SelectItem>
            <SelectItem value="this_year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedOrPaid}</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{completionRate}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="size-4 text-blue-600" />
              No Prazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedOnTime}</div>
            <Progress value={onTimeRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{onTimeRate}% das concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="size-4 text-blue-600" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressObligations.length}</div>
            <p className="text-xs text-muted-foreground mt-3">
              {Math.round((inProgressObligations.length / (totalEventsConsidered || 1)) * 100)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="size-4 text-gray-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingObligations.length + pendingInstallments.length + pendingTaxes.length}</div>
            <p className="text-xs text-muted-foreground mt-3">Aguardando início/pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-3">Requerem atenção imediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Detalhados */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Por Cliente</TabsTrigger>
          <TabsTrigger value="type">Por Tipo</TabsTrigger>
          <TabsTrigger value="tax">Por Imposto (Obrigações)</TabsTrigger>
          <TabsTrigger value="recurrence">Por Recorrência</TabsTrigger>
          <TabsTrigger value="completed">Finalizadas</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Cliente</CardTitle>
              <CardDescription>Distribuição de tarefas entre os clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(byClient).map(([client, stats]) => (
                  <div key={client} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{client}</span>
                      <span className="text-sm text-muted-foreground">{stats.total} eventos</span>
                    </div>
                    <div className="flex gap-2">
                      {stats.completed > 0 && <Badge className="bg-green-600">{stats.completed} concluídos</Badge>}
                      {stats.inProgress > 0 && <Badge className="bg-blue-600">{stats.inProgress} em andamento</Badge>}
                      {stats.pending > 0 && <Badge variant="secondary">{stats.pending} pendentes</Badge>}
                      {stats.overdue > 0 && <Badge variant="destructive">{stats.overdue} atrasados</Badge>}
                    </div>
                    <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="type" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Tipo</CardTitle>
              <CardDescription>Distribuição por categoria de evento fiscal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(byType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{type === "obligation" ? "Obrigações" : type === "tax" ? "Impostos" : "Parcelamentos"}</span>
                        <Badge variant="outline">{count} eventos</Badge>
                      </div>
                      <Progress value={(count / totalEventsConsidered) * 100} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações por Tipo de Imposto</CardTitle>
              <CardDescription>Distribuição por categoria fiscal (apenas obrigações)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(byTax)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([tax, stats]) => (
                    <div key={tax} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tax}</span>
                        <span className="text-sm text-muted-foreground">{stats.total} obrigações</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-green-600">{stats.completed} concluídas</Badge>
                        <Badge variant="secondary">{stats.total - stats.completed} pendentes</Badge>
                      </div>
                      <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurrence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos por Tipo de Recorrência</CardTitle>
              <CardDescription>Distribuição por frequência de vencimento (obrigações e parcelamentos)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(byRecurrence).map(([recurrence, count]) => (
                  <div key={recurrence} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{recurrence}</span>
                    <Badge variant="outline">{count} eventos</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Finalizados</CardTitle>
              <CardDescription>Histórico de tarefas concluídas e parcelamentos pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {totalCompletedOrPaid === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum evento concluído ainda</p>
                ) : (
                  [...completedObligations, ...completedInstallments].sort((a,b) => new Date(b.calculatedDueDate).getTime() - new Date(a.calculatedDueDate).getTime()).map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{event.name}</div>
                        <div className="text-sm text-muted-foreground">{event.client.name}</div>
                        {event.type === "obligation" && (event as ObligationWithDetails).realizationDate && (
                          <div className="text-xs text-muted-foreground">
                            Realizada em: {formatDate((event as ObligationWithDetails).realizationDate!)}
                          </div>
                        )}
                        {event.type === "installment" && (event as InstallmentWithDetails).completedAt && (
                          <div className="text-xs text-muted-foreground">
                            Concluído em: {formatDate((event as InstallmentWithDetails).completedAt!)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-600 mt-1">
                          <CheckCircle2 className="size-3 mr-1" />
                          Concluído
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}