import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TaxDueDate } from "@/lib/types"
import { formatDate } from "@/lib/date-utils"
import { Calendar, Clock, DollarSign, FileText, Tag, User } from "lucide-react"

interface TaxDetailsProps {
  tax: TaxDueDate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaxDetails({ tax, open, onOpenChange }: TaxDetailsProps) {
  const getStatusVariant = (status: TaxDueDate['status']) => {
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
              <DialogTitle className="text-2xl font-bold">{tax.name}</DialogTitle>
              <DialogDescription>
                Detalhes do evento fiscal para {tax.client.name}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-4" /> Vencimento
                  </p>
                  <p className="text-lg font-semibold">{formatDate(tax.calculatedDueDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="size-4" /> Status
                  </p>
                  <Badge variant={getStatusVariant(tax.status)} className="text-lg">
                    {tax.status.charAt(0).toUpperCase() + tax.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="size-4" /> Cliente
                </p>
                <p className="text-base">{tax.client.name} ({tax.client.cnpj})</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="size-4" /> Descrição
                </p>
                <p className="text-base">{tax.description || "Nenhuma descrição fornecida."}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Cód. Federal</p>
                  <p className="text-base">{tax.federalTaxCode || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Cód. Estadual</p>
                  <p className="text-base">{tax.stateTaxCode || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Cód. Municipal</p>
                  <p className="text-base">{tax.municipalTaxCode || 'N/A'}</p>
                </div>
              </div>

              {/* Tags Section */}
              {tax.tags && tax.tags.length > 0 && (
                <>
                  <div className="space-y-1 pt-4">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Tag className="size-4" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tax.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Notes Section */}
              {tax.notes && (
                <div className="space-y-1 pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Notas</p>
                  <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                    {tax.notes}
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