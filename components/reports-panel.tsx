"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, AlertTriangle, Calendar, TrendingUp, Users, BarChart3, PieChart, LayoutDashboard } from "lucide-react"
import type { ObligationWithDetails } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"
import { useState, useMemo } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Pie, PieSector, Cell } from "recharts"
import { calculateProductivityMetrics } from "@/lib/metrics" // Import calculateProductivityMetrics

type ReportsPanelProps = {
  obligations: ObligationWithDetails[]
}

const statusColors = {
  pending: "hsl(var(--chart-4))",
  in_progress: "hsl(var(--chart-2))",
  completed: "hsl(var(--chart-1))",
  overdue: "hsl(var(--chart-5))",
};

const priorityColors = {
  urgent: "hsl(var(--chart-5))",
  high: "hsl(var(--chart-4))",
  medium: "hsl(var(--chart-3))",
  low: "hsl(var(--chart-2))",
};

export function ReportsPanel({ obligations }: ReportsPanelProps) {
  const [periodFilter, setPeriodFilter] = useState<string>("all")

  const filteredObligations = useMemo(() => {
    return obligations.filter((obl) => {
      const oblDate = new Date(obl.calculatedDueDate)
      const now = new Date()

      switch (periodFilter) {
        case "this_month":
          return oblDate.getMonth() === now.getMonth() && oblDate.getFullYear() === now.getFullYear()
        case "last_month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          return oblDate.getMonth() === lastMonth.getMonth() && oblDate.getFullYear() === lastMonth.getFullYear()
        case "this_quarter":
          const quarter = Math.floor(now.getMonth() / 3)
          const oblQuarter = Math.floor(oblDate.getMonth() / 3)
          return oblQuarter === quarter && oblDate.getFullYear() === now.getFullYear()
        case "this_year":
          return oblDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }, [obligations, periodFilter]);

  const metrics = useMemo(() => calculateProductivityMetrics(filteredObligations), [filteredObligations]);

  const completed = filteredObligations.filter((o) => o.status === "completed")
  const inProgress = filteredObligations.filter((o) => o.status === "in_progress")
  const pending = filteredObligations.filter((o) => o.status === "pending")
  const overdue = filteredObligations.filter((o) => o.status === "overdue")

  const completionRate =
    filteredObligations.length > 0 ? Math.round((completed.length / filteredObligations.length) * 100) : 0

  const completedOnTime = completed.filter((obl) => {
    if (!obl.realizationDate) return false
    return new Date(obl.realizationDate) <= new Date(obl.calculatedDueDate)
  })
  const onTimeRate = completed.length > 0 ? Math.round((completedOnTime.length / completed.length) * 100) : 0

  // Obrigações por cliente
  const byClient = filteredObligations.reduce(
    (acc, obl) => {
      const clientName = obl.client.name
      if (!acc[clientName]) {
        acc[clientName] = { total: 0, completed: 0, pending: 0, inProgress: 0 }
      }
      acc[clientName].total++
      if (obl.status === "completed") acc[clientName].completed++
      if (obl.status === "pending") acc[clientName].pending++
      if (obl.status === "in_progress") acc[clientName].inProgress++
      return acc
    },
    {} as Record<string, { total: number; completed: number; pending: number; inProgress: number }>,
  )

  // Obrigações por tipo de recorrência
  const byRecurrence = filteredObligations.reduce(
    (acc, obl) => {
      const recurrence = getRecurrenceDescription(obl)
      acc[recurrence] = (acc[recurrence] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const byTax = filteredObligations.reduce(
    (acc, obl) => {
      const taxName = obl.tax?.name || "Sem imposto"
      if (!acc[taxName]) {
        acc[taxName] = { total: 0, completed: 0 }
      }
      acc[taxName].total++
      if (obl.status === "completed") acc[taxName].completed++
      return acc
    },
    {} as Record<string, { total: number; completed: number }>,
  )

  const obligationsByStatusChartData = metrics.obligationsByStatus.map(item => ({
    name: item.status === "pending" ? "Pendente" : item.status === "in_progress" ? "Em Andamento" : item.status === "completed" ? "Concluída" : "Atrasada",
    count: item.count,
    fill: statusColors[item.status as keyof typeof statusColors],
  }));

  const obligationsByPriorityChartData = metrics.byPriority.map(item => ({
    name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    value: item.count,
    fill: priorityColors[item.priority as keyof typeof priorityColors],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground p-2 border rounded-md text-sm shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
            <div className="text-2xl font-bold">{completed.length}</div>
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
            <div className="text-2xl font-bold">{completedOnTime.length}</div>
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
            <div className="text-2xl font-bold">{inProgress.length}</div>
            <p className="text-xs text-muted-foreground mt-3">
              {Math.round((inProgress.length / (filteredObligations.length || 1)) * 100)}% do total
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
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-3">Aguardando início</p>
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
            <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
            <p className="text-xs text-muted-foreground mt-3">Requerem atenção imediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Obrigações por Status
            </CardTitle>
            <CardDescription>Distribuição atual das obrigações por status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: "Concluída", color: statusColors.completed },
                in_progress: { label: "Em Andamento", color: statusColors.in_progress },
                pending: { label: "Pendente", color: statusColors.pending },
                overdue: { label: "Atrasada", color: statusColors.overdue },
              }}
              className="min-h-[200px] w-full"
            >
              <BarChart accessibilityLayer data={obligationsByStatusChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  className="text-xs"
                />
                <ChartTooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="dataKey" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="size-5" />
              Obrigações por Prioridade
            </CardTitle>
            <CardDescription>Distribuição das obrigações por nível de prioridade.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer
              config={{
                urgent: { label: "Urgente", color: priorityColors.urgent },
                high: { label: "Alta", color: priorityColors.high },
                medium: { label: "Média", color: priorityColors.medium },
                low: { label: "Baixa", color: priorityColors.low },
              }}
              className="min-h-[200px] w-full"
            >
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <ChartTooltip content={<CustomTooltip />} />
                  <Pie
                    data={obligationsByPriorityChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    cornerRadius={5}
                  >
                    {obligationsByPriorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Detalhados */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Por Cliente</TabsTrigger>
          <TabsTrigger value="tax">Por Imposto</TabsTrigger>
          <TabsTrigger value="recurrence">Por Recorrência</TabsTrigger>
          <TabsTrigger value="completed">Finalizadas</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações por Cliente</CardTitle>
              <CardDescription>Distribuição de tarefas entre os clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(byClient).map(([client, stats]) => (
                  <div key={client} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{client}</span>
                      <span className="text-sm text-muted-foreground">{stats.total} obrigações</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-600">{stats.completed} concluídas</Badge>
                      <Badge className="bg-blue-600">{stats.inProgress} em andamento</Badge>
                      <Badge variant="secondary">{stats.pending} pendentes</Badge>
                    </div>
                    <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
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
              <CardDescription>Distribuição por categoria fiscal</CardDescription>
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
              <CardTitle>Obrigações por Tipo de Recorrência</CardTitle>
              <CardDescription>Distribuição por frequência de vencimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(byRecurrence).map(([recurrence, count]) => (
                  <div key={recurrence} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{recurrence}</span>
                    <Badge variant="outline">{count} obrigações</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações Finalizadas</CardTitle>
              <CardDescription>Histórico de tarefas concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completed.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma obrigação concluída ainda</p>
                ) : (
                  completed.map((obl) => (
                    <div key={obl.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{obl.name}</div>
                        <div className="text-sm text-muted-foreground">{obl.client.name}</div>
                        {obl.realizationDate && (
                          <div className="text-xs text-muted-foreground">
                            Realizada em: {formatDate(obl.realizationDate)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {obl.amount && <div className="font-medium">{formatCurrency(obl.amount)}</div>}
                        <Badge className="bg-green-600 mt-1">
                          <CheckCircle2 className="size-3 mr-1" />
                          Concluída
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