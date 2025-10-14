"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertTriangle, FileText, DollarSign } from "lucide-react"
import type { ObligationWithDetails, InstallmentWithDetails, TaxDueDate, CalendarEvent } from "@/lib/types"
import { formatDate, isOverdue } from "@/lib/date-utils"

type UpcomingFiscalEventsProps = {
  obligations: ObligationWithDetails[]
  installments: InstallmentWithDetails[]
  taxesDueDates: TaxDueDate[]
}

export function UpcomingFiscalEvents({ obligations, installments, taxesDueDates }: UpcomingFiscalEventsProps) {
  const allUpcomingEvents: CalendarEvent[] = [
    ...obligations.filter(o => o.status === "pending" || o.status === "in_progress"),
    ...installments.filter(i => i.status === "pending"),
    ...taxesDueDates.filter(t => t.status === "pending" || t.status === "overdue"), // Include overdue taxes here
  ];

  const sortedEvents = [...allUpcomingEvents]
    .sort((a, b) => new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime())
    .slice(0, 8)

  const getEventIcon = (event: CalendarEvent) => {
    if (isOverdue(event.calculatedDueDate)) return <AlertTriangle className="size-4 text-red-600 flex-shrink-0" />;
    if (event.type === "obligation") return <FileText className="size-4 text-blue-600 flex-shrink-0" />;
    if (event.type === "installment") return <DollarSign className="size-4 text-green-600 flex-shrink-0" />;
    if (event.type === "tax") return <Calendar className="size-4 text-purple-600 flex-shrink-0" />;
    return <Calendar className="size-4 text-muted-foreground flex-shrink-0" />;
  };

  const getEventBadge = (event: CalendarEvent) => {
    if (event.type === "obligation") {
      return <Badge variant="outline" className="mt-1 text-xs">Obrigação</Badge>;
    }
    if (event.type === "installment") {
      return <Badge variant="outline" className="mt-1 text-xs">Parcelamento</Badge>;
    }
    if (event.type === "tax") {
      return <Badge variant="outline" className="mt-1 text-xs">Imposto</Badge>;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Vencimentos mais próximos de obrigações, impostos e parcelamentos</CardDescription>
          </div>
          <Calendar className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum evento pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => {
              const overdue = isOverdue(event.calculatedDueDate)
              return (
                <div
                  key={event.id}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    overdue ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20" : "bg-muted/50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getEventIcon(event)}
                      <p className="font-medium text-sm truncate">{event.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{event.client.name}</p>
                    {getEventBadge(event)}
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className={`text-sm font-medium ${overdue ? "text-red-600" : ""}`}>
                      {formatDate(event.calculatedDueDate)}
                    </p>
                    {overdue && <p className="text-xs text-red-600">Atrasado</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}