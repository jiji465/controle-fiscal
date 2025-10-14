"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, CalendarIcon, Filter, Building2, Receipt, DollarSign, User, FileText, Clock } from "lucide-react"
import type { CalendarEvent, ObligationWithDetails, TaxWithDetails } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/date-utils"
import { Separator } from "@/components/ui/separator"

type CalendarViewProps = {
  events: CalendarEvent[]
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedEventDetails, setSelectedEventDetails] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const uniqueClients = Array.from(new Set(
    events
      .filter((event): event is ObligationWithDetails => 'clientId' in event)
      .map((o) => o.client.name)
  )).sort()

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0]
    return events.filter((event) => {
      const eventDate = new Date(event.calculatedDueDate).toISOString().split("T")[0]
      const matchesDate = eventDate === dateStr

      const matchesClient = filterClient === "all" || !('clientId' in event) || event.client.name === filterClient;

      const matchesStatus = filterStatus === "all" || event.status === filterStatus;

      return matchesDate && matchesClient && matchesStatus
    })
  }

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const calendarDays = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
      case "in_progress":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
      case "overdue":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
      default: // pending
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
    }
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEventDetails(event);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendário de Vencimentos</CardTitle>
              <CardDescription>Visualize as obrigações e impostos por data com filtros personalizados</CardDescription>
            </div>
            <CalendarIcon className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <h3 className="text-lg font-semibold min-w-[180px] text-center">
                  {monthNames[month]} {year}
                </h3>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoje
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {uniqueClients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="overdue">Atrasada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dayEvents = getEventsForDay(day)
                const isToday =
                  day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
                const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square border rounded-lg p-1 flex flex-col hover:bg-accent transition-colors ${
                      isToday ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""
                    } ${isWeekend ? "bg-muted/30" : ""} ${dayEvents.length > 0 ? "cursor-pointer" : ""}`}
                  >
                    <div className={`text-sm font-medium ${isToday ? "text-primary font-bold" : ""}`}>{day}</div>
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate border ${getStatusColor(event.status)}`}
                          title={`${event.name} - ${'client' in event ? event.client.name : 'Imposto'}`}
                        >
                          {event.name}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-muted-foreground font-medium">
                          +{dayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Legenda</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-primary rounded ring-2 ring-primary/20" />
                  <span className="text-muted-foreground">Hoje</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-muted/30 rounded" />
                  <span className="text-muted-foreground">Final de semana</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-yellow-500/20 border border-yellow-500/30 rounded" />
                  <span className="text-muted-foreground">Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-blue-500/20 border border-blue-500/30 rounded" />
                  <span className="text-muted-foreground">Em Andamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-green-500/20 border border-green-500/30 rounded" />
                  <span className="text-muted-foreground">Concluída</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-red-500/20 border border-red-500/30 rounded" />
                  <span className="text-muted-foreground">Atrasada</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedDay !== null} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Eventos de {selectedDay} de {monthNames[month]} de {year}
            </DialogTitle>
            <DialogDescription>{selectedDayEvents.length} evento(s) nesta data</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedDayEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum evento nesta data</p>
            ) : (
              selectedDayEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/50" onClick={() => handleEventClick(event)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{event.name}</h4>
                      {'client' in event && <p className="text-sm text-muted-foreground">{event.client.name}</p>}
                      {'federalTaxCode' in event && <p className="text-sm text-muted-foreground">Imposto</p>}
                    </div>
                    <Badge
                      className={
                        event.status === "completed"
                          ? "bg-green-600"
                          : event.status === "in_progress"
                            ? "bg-blue-600"
                            : event.status === "overdue"
                              ? "bg-red-600"
                              : "bg-yellow-600"
                      }
                    >
                      {event.status === "completed"
                        ? "Concluída"
                        : event.status === "in_progress"
                          ? "Em Andamento"
                          : event.status === "overdue"
                            ? "Atrasada"
                            : "Pendente"}
                    </Badge>
                  </div>
                  {'tax' in event && event.tax && <p className="text-sm">Imposto: {event.tax.name}</p>}
                  {'description' in event && event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Vencimento: {formatDate(event.calculatedDueDate)}</span>
                    {'realizationDate' in event && event.realizationDate && <span>Realizada: {formatDate(event.realizationDate)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectedEventDetails !== null} onOpenChange={() => setSelectedEventDetails(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedEventDetails && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedEventDetails.name}</DialogTitle>
                    {'description' in selectedEventDetails && selectedEventDetails.description && (
                      <DialogDescription className="text-sm text-muted-foreground mt-1">
                        {selectedEventDetails.description}
                      </DialogDescription>
                    )}
                  </div>
                  <Badge
                    className={
                      selectedEventDetails.status === "completed"
                        ? "bg-green-600"
                        : selectedEventDetails.status === "in_progress"
                          ? "bg-blue-600"
                          : selectedEventDetails.status === "overdue"
                            ? "bg-red-600"
                            : "bg-gray-600"
                    }
                  >
                    {selectedEventDetails.status === "completed"
                      ? "Concluída"
                      : selectedEventDetails.status === "in_progress"
                        ? "Em Andamento"
                        : selectedEventDetails.status === "overdue"
                          ? "Atrasada"
                          : "Pendente"}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid gap-4">
                  {'client' in selectedEventDetails && (
                    <div className="flex items-center gap-3">
                      <Building2 className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Cliente</p>
                        <p className="text-sm text-muted-foreground">{selectedEventDetails.client.name}</p>
                      </div>
                    </div>
                  )}

                  {'tax' in selectedEventDetails && selectedEventDetails.tax && (
                    <div className="flex items-center gap-3">
                      <Receipt className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Imposto</p>
                        <p className="text-sm text-muted-foreground">{selectedEventDetails.tax.name}</p>
                      </div>
                    </div>
                  )}
                  {'federalTaxCode' in selectedEventDetails && (
                    <div className="flex items-center gap-3">
                      <Receipt className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Imposto</p>
                        <p className="text-sm text-muted-foreground">{selectedEventDetails.name}</p>
                        {selectedEventDetails.federalTaxCode && <p className="text-xs text-muted-foreground">Código: {selectedEventDetails.federalTaxCode}</p>}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Vencimento</p>
                      <p className="text-sm text-muted-foreground font-mono">{formatDate(selectedEventDetails.calculatedDueDate)}</p>
                    </div>
                  </div>

                  {'amount' in selectedEventDetails && selectedEventDetails.amount && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Valor</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(selectedEventDetails.amount)}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Clock className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Criada em</p>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedEventDetails.createdAt)}</p>
                    </div>
                  </div>

                  {selectedEventDetails.completedAt && (
                    <div className="flex items-center gap-3">
                      <User className="size-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Concluída em</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(selectedEventDetails.completedAt)}
                          {selectedEventDetails.completedBy && ` por ${selectedEventDetails.completedBy}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {'notes' in selectedEventDetails && selectedEventDetails.notes && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Observações</p>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEventDetails.notes}</p>
                    </div>
                  </>
                )}

                {'history' in selectedEventDetails && selectedEventDetails.history && selectedEventDetails.history.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-3">Histórico de Ações</p>
                      <div className="space-y-3">
                        {selectedEventDetails.history.map((entry) => (
                          <div key={entry.id} className="flex gap-3 text-sm">
                            <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <p className="text-muted-foreground">{entry.description}</p>
                              <p className="text-xs text-muted-foreground/70">{formatDate(entry.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}