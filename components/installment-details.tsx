"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, FileText, DollarSign, Building2, Hash } from "lucide-react"
import type { InstallmentWithDetails } from "@/lib/types"
import { formatDate } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"

type InstallmentDetailsProps = {
  installment: InstallmentWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstallmentDetails({ installment, open, onOpenChange }: InstallmentDetailsProps) {
  const getStatusColor = () => {
    switch (installment.status) {
      case "completed":
        return "bg-green-600"
      case "in_progress":
        return "bg-blue-600"
      case "overdue":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusLabel = () => {
    switch (installment.status) {
      case "completed":
        return "Concluído"
      case "in_progress":
        return "Em Andamento"
      case "overdue":
        return "Atrasado"
      default:
        return "Pendente"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{installment.name}</DialogTitle>
              {installment.description && (
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {installment.description}
                </DialogDescription>
              )}
            </div>
            <Badge className={getStatusColor()}>{getStatusLabel()}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações principais */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-sm text-muted-foreground">{installment.client.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Hash className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Parcela</p>
                <p className="text-sm text-muted-foreground">
                  {installment.installmentNumber} de {installment.totalInstallments}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vencimento</p>
                <p className="text-sm text-muted-foreground font-mono">{formatDate(installment.calculatedDueDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Criado em</p>
                <p className="text-sm text-muted-foreground">{formatDate(installment.createdAt)}</p>
              </div>
            </div>

            {installment.completedAt && (
              <div className="flex items-center gap-3">
                <User className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Concluído em</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(installment.completedAt)}
                    {installment.completedBy && ` por ${installment.completedBy}`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Recorrência</p>
                <p className="text-sm text-muted-foreground">{getRecurrenceDescription(installment)}</p>
              </div>
            </div>
          </div>

          {installment.notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Observações</p>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{installment.notes}</p>
              </div>
            </>
          )}

          {/* Tags Section */}
          {installment.tags && installment.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Tags</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {installment.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}