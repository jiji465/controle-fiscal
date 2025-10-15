import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ObligationWithDetails } from "@/lib/types"
import { formatDate } from "@/lib/date-utils"
import { Calendar, Clock, Tag, User, FileText, Link, Hash, TrendingUp, CheckCircle } from "lucide-react"

interface ObligationDetailsProps {
  obligation: ObligationWithDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ObligationDetails({ obligation, open, onOpenChange }: ObligationDetailsProps) {
  const getStatusVariant = (status: ObligationWithDetails['status']): 'success' | 'destructive' | 'warning' | 'secondary' => {
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

  const getPriorityVariant = (priority: ObligationWithDetails['priority']): 'destructive' | 'warning' | 'default' | 'secondary' => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'warning'
      case 'medium':
        return 'default'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{obligation.name}</DialogTitle>
              <DialogDescription>
                Detalhes da obrigação acessória para {obligation.client.name}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-4" /> Vencimento
                  </p>
                  <p className="text-lg font-semibold">{formatDate(obligation.calculatedDueDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="size-4" /> Status
                  </p>
                  <Badge variant={getStatusVariant(obligation.status)} className="text-lg">
                    {obligation.status.charAt(0).toUpperCase() + obligation.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="size-4" /> Prioridade
                  </p>
                  <Badge variant={getPriorityVariant(obligation.priority)}>
                    {obligation.priority.charAt(0).toUpperCase() + obligation.priority.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="size-4" /> Responsável
                  </p>
                  <p className="text-base">{obligation.assignedTo || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Hash className="size-4" /> Protocolo
                  </p>
                  <p className="text-base">{obligation.protocol || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="size-4" /> Descrição
                </p>
                <p className="text-base">{obligation.description || "Nenhuma descrição fornecida."}</p>
              </div>

              {/* Attachments Section */}
              {obligation.attachments && obligation.attachments.length > 0 && (
                <>
                  <div className="space-y-1 pt-4">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Link className="size-4" /> Anexos
                    </p>
                    <div className="space-y-2">
                      {obligation.attachments.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline text-sm truncate"
                        >
                          <Link className="size-4 flex-shrink-0" />
                          Anexo {index + 1}: {url}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Tags Section */}
              {obligation.tags && obligation.tags.length > 0 && (
                <>
                  <div className="space-y-1 pt-4">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Tag className="size-4" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {obligation.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Completion Info */}
              {obligation.status === 'completed' && (
                <div className="space-y-1 pt-4 border-t pt-4">
                  <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <CheckCircle className="size-4" /> Conclusão
                  </p>
                  <p className="text-base">
                    Realizado em: {formatDate(obligation.realizationDate || obligation.completedAt || 'N/A')}
                  </p>
                  <p className="text-base">
                    Concluído por: {obligation.completedBy || 'Sistema'}
                  </p>
                </div>
              )}

              {/* History Section */}
              {obligation.history && obligation.history.length > 0 && (
                <div className="space-y-1 pt-4 border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Histórico</p>
                  <div className="space-y-2 text-sm max-h-40 overflow-y-auto p-2 border rounded-md">
                    {obligation.history.map((entry, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{formatDate(entry.timestamp.split('T')[0])}</span>
                        <span>{entry.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {obligation.notes && (
                <div className="space-y-1 pt-4">
                  <p className="text-sm font-medium text-muted-foreground">Notas Internas</p>
                  <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                    {obligation.notes}
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