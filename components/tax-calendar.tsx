"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, Clock } from "lucide-react"
import type { TaxWithDetails } from "@/lib/types" // Changed to TaxWithDetails
import { formatDate, isOverdue } from "@/lib/date-utils"

type TaxCalendarProps = {
  taxes: TaxWithDetails[] // Expecting TaxWithDetails[]
}

export function TaxCalendar({ taxes }: TaxCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize today for comparison

  // Filter and group taxes by their calculated due day
  const taxesByCalculatedDay = taxes.reduce(
    (acc, tax) => {
      const dueDate = new Date(tax.calculatedDueDate);
      // Only consider taxes for the current month or the next month, and not in the past
      const isCurrentMonth = dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
      const isNextMonth = dueDate.getMonth() === (today.getMonth() + 1) % 12 &&
                          dueDate.getFullYear() === (dueDate.getMonth() === 0 ? today.getFullYear() + 1 : today.getFullYear());

      if ((isCurrentMonth || isNextMonth) && dueDate >= today) {
        const day = dueDate.getDate();
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(tax);
      }
      return acc;
    },
    {} as Record<number, TaxWithDetails[]>,
  );

  // Prepare upcoming taxes for display
  const upcomingTaxes = Object.entries(taxesByCalculatedDay)
    .map(([day, taxList]) => {
      const firstTaxDueDate = new Date(taxList[0].calculatedDueDate); // Use the actual calculated date
      return {
        day: Number.parseInt(day),
        date: firstTaxDueDate,
        taxes: taxList,
        isOverdue: isOverdue(firstTaxDueDate.toISOString()),
        daysUntil: Math.ceil((firstTaxDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10); // Limit to 10 upcoming entries

  const getUrgencyColor = (daysUntil: number, isOverdue: boolean) => {
    if (isOverdue) return "text-red-600 bg-red-50 dark:bg-red-950/30"
    if (daysUntil <= 3) return "text-orange-600 bg-orange-50 dark:bg-orange-950/30"
    if (daysUntil <= 7) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30"
    return "text-blue-600 bg-blue-50 dark:bg-blue-950/30"
  }

  const getUrgencyIcon = (daysUntil: number, isOverdue: boolean) => {
    if (isOverdue) return <AlertCircle className="size-4" />
    if (daysUntil <= 3) return <Clock className="size-4" />
    return <Calendar className="size-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5" />
          Calendário de Vencimentos de Impostos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingTaxes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="size-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum imposto com vencimento definido</p>
            </div>
          ) : (
            upcomingTaxes.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getUrgencyColor(item.daysUntil, item.isOverdue)} transition-all hover-lift`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{getUrgencyIcon(item.daysUntil, item.isOverdue)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{formatDate(item.date.toISOString())}</span>
                        <Badge variant="outline" className="text-xs">
                          Dia {item.day}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {item.taxes.map((tax) => (
                          <div key={tax.id} className="text-sm font-medium">
                            {tax.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {item.isOverdue ? "Atrasado" : item.daysUntil === 0 ? "Hoje" : `${item.daysUntil}d`}
                    </div>
                    <div className="text-xs opacity-75">
                      {item.taxes.length} {item.taxes.length === 1 ? "imposto" : "impostos"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}