import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InstallmentWithDetails } from "@/lib/types"
import { formatDate } from "@/lib/date-utils"
import { Calendar, Clock, DollarSign, Tag, User, Hash, CheckCircle } from "lucide-react"

interface InstallmentDetailsProps {
  installment: InstallmentWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstallmentDetails({ installment, open, onOpenChange }: InstallmentDetailsProps) {
  const getStatusVariant = (status: InstallmentWithDetails['status']): 'success' | 'destructive' | 'warning' | 'secondary' => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'overdue':
        return 'destructive'
      case 'in_progress':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{installment.name}</DialogTitle>
              <DialogDescription>
                Detalhes do parcelamento para {installment.client.name}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-4" /> Vencimento
                  </p>
                  <p className="text-lg font-semibold">{formatDate(installment.calculatedDueDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="size-4" /> Status
                  </p>
                  <Badge variant={getStatusVariant(installment.status)} className="text-lg">
                    {installment.status.charAt(0).toUpperCase() + installment.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="size-4" /> Cliente
                </p>
                <p className="text-base">{installment.client.name} ({installment.client.cnpj})</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Hash className="size-4" /> Parcela
                  </p>
                  <p className="text-base">{installment.installmentNumber} de {installment.totalInstallments}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <DollarSign className="size-4" /> Recorrência
                  </p>
                  <p className="text-base">{installment.recurrence.charAt(0).toUpperCase() + installment.recurrence.slice(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-4" /> Vencimento Base
                  </p>
                  <p className="text-base">Dia {installment.dueDay}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-base">{installment.description || "Nenhuma descrição fornecida."}</p>
              </div>

              {/* Tags Section */}
              {installment.tags && installment.tags.length > 0 && (
                <>
                  <div className="space-y-1 pt-4">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Tag className="size-4" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {installment.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Completion Info */}
              {installment.status === 'completed' && (
                <div className="space-y-1 pt-4 border-t pt-4">
                  <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle className="size-4" /> Conclusão
                  </p>
                  <p className="text-base">
                    Concluído em: {formatDate(installment.completedAt || 'N/A')}
                  </p>
                  <p className="text-base">
                    Concluído por: {installment.completedBy || 'Sistema'}
                  </p>
                </div>
              )}

              {/* Notes Section */}
              {installment.notes && (
                <div className="space-y-1 pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Notas Internas</p>
                  <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                    {installment.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}