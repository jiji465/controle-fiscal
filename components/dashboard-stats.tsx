import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardStats } from "@/lib/types"
import { Users, FileText, CheckCircle, AlertTriangle, Calendar } from "lucide-react"

interface DashboardStatsCardsProps {
  stats: DashboardStats
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const data = [
    {
      title: "Clientes Ativos",
      value: stats.totalClients,
      subtitle: `${stats.activeClients} ativos`,
      icon: Users,
    },
    {
      title: "Eventos Fiscais Totais",
      value: stats.totalEvents,
      subtitle: `${stats.pendingEvents} pendentes`,
      icon: FileText,
    },
    {
      title: "Finalizados este Mês",
      value: stats.completedThisMonth,
      subtitle: "Obrigações e parcelamentos",
      icon: CheckCircle,
    },
    {
      title: "Atrasados",
      value: stats.overdueEvents,
      subtitle: "Requerem atenção",
      icon: AlertTriangle,
    },
    {
      title: "Vencendo esta Semana",
      value: stats.upcomingThisWeek,
      subtitle: "Próximos 7 dias",
      icon: Calendar,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {data.map((item, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}