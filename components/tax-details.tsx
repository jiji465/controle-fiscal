"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, FileText, DollarSign, Building2, Receipt } from "lucide-react"
import type { TaxDueDate } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"

type TaxDetailsProps = {
  tax: TaxDueDate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaxDetails({ tax, open, onOpenChange }: TaxDetailsProps) {
  const getStatusColor = () => {
    switch (tax.status) {
      case "completed": // Taxes don't typically have 'completed' status, but mirroring obligation
        return "bg-green-600"
      case "in_progress": // Taxes don't typically have 'in_progress' status, but mirroring obligation
        return "bg-blue-600"
      case "overdue":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusLabel = () => {
    switch (tax.status) {
      case "completed":
        return "Processado" // Changed label for tax
      case "in_progress":
        return "Em Processamento" // Changed label for tax
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
              <DialogTitle className="text-2xl">{tax.name}</DialogTitle>
              {tax.description && (
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  {tax.description}
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
                <p className="text-sm text-muted-foreground">{tax.client.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Receipt className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Imposto</p>
                <p className="text-sm text-muted-foreground">{tax.name}</p>
                {tax.federalTaxCode && <p className="text-xs text-muted-foreground">Código: {tax.federalTaxCode}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vencimento</p>
                <p className="text-sm text-muted-foreground font-mono">{formatDate(tax.calculatedDueDate)}</p>
              </div>
            </div>

            {tax.amount && ( // Tax templates don't have amount, but TaxDueDate could if we add it
              <div className="flex items-center gap-3">
                <DollarSign className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Valor</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(tax.amount)}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Clock className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Criado em</p>
                <p className="text-sm text-muted-foreground">{formatDate(tax.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Recorrência</p>
                <p className="text-sm text-muted-foreground">{getRecurrenceDescription(tax)}</p>
              </div>
            </div>
          </div>

          {tax.notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Observações</p>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{tax.notes}</p>
              </div>
            </>
          )}

          {/* Tags Section */}
          {tax.tags && tax.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Tags</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tax.tags.map((tag, index) => (
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