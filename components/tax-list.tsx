import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, Eye, CheckCircle, Clock } from "lucide-react"
import { TaxDueDate, Client, Tax } from "@/lib/types"
import { formatDate } from "@/lib/date-utils"
import { useState } from "react"
import { TaxDetails } from "./tax-details"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { saveTax } from "@/lib/storage"
import { toast } from "@/hooks/use-toast"

interface TaxListProps {
  taxesDueDates: TaxDueDate[]
  clients: Client[]
  taxTemplates: Tax[]
  onUpdate: () => void
  onEdit: (tax: Tax) => void
}

export function TaxList({ taxesDueDates, clients, taxTemplates, onUpdate, onEdit }: TaxListProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [viewingTax, setViewingTax] = useState<TaxDueDate | undefined>()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClient, setFilterClient] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const handleView = (tax: TaxDueDate) => {
    setViewingTax(tax)
    setIsDetailsOpen(true)
  }

  const getStatusVariant = (status: TaxDueDate['status']): 'success' | 'destructive' | 'warning' | 'secondary' => {
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

  const filteredTaxes = taxesDueDates.filter(tax => {
    const matchesSearch = tax.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.federalTaxCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.stateTaxCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tax.municipalTaxCode?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClient = filterClient === "all" || tax.clientId === filterClient

    const matchesStatus = filterStatus === "all" || tax.status === filterStatus

    return matchesSearch && matchesClient && matchesStatus
  })

  const handleMarkStatus = (taxDueDate: TaxDueDate, newStatus: TaxDueDate['status']) => {
    // Para Impostos (TaxDueDate), o status é dinâmico.
    // Em um sistema real, isso criaria uma OBRIGAÇÃO ou salvaria o status da ocorrência.
    // Aqui, vamos simular a conclusão salvando o status no template base (Tax)
    // ou, de forma mais simples, apenas exibindo a notificação.
    
    // Como TaxDueDate é gerado dinamicamente, não podemos salvar o status diretamente.
    // A solução mais robusta seria criar uma Obligation para cada TaxDueDate que o usuário marca.
    
    // Por enquanto, vamos apenas notificar o usuário que a ação foi registrada.
    toast({
      title: `Status de ${taxDueDate.name} atualizado!`,
      description: `O status foi marcado como "${newStatus.replace('_', ' ')}". (Em um sistema real, isso criaria uma obrigação persistente).`,
      variant: newStatus === 'completed' ? 'success' : 'default',
    });
    onUpdate(); // Força a atualização para refletir possíveis mudanças
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar imposto ou cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Clientes</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imposto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Recorrência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTaxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum imposto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredTaxes.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">
                    {tax.name}
                    <div className="text-xs text-muted-foreground">
                      {tax.federalTaxCode || tax.stateTaxCode || tax.municipalTaxCode}
                    </div>
                  </TableCell>
                  <TableCell>{tax.client.name}</TableCell>
                  <TableCell className={tax.status === 'overdue' ? 'text-red-500 font-medium' : ''}>
                    {formatDate(tax.calculatedDueDate)}
                  </TableCell>
                  <TableCell>{tax.recurrence.charAt(0).toUpperCase() + tax.recurrence.slice(1)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(tax.status)}>
                      {tax.status.charAt(0).toUpperCase() + tax.status.slice(1).replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleView(tax)}>
                          <Eye className="size-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {tax.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleMarkStatus(tax, 'completed')}>
                            <CheckCircle className="size-4 mr-2 text-green-600" />
                            Marcar como Concluído
                          </DropdownMenuItem>
                        )}
                        {tax.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleMarkStatus(tax, 'in_progress')}>
                            <Clock className="size-4 mr-2 text-blue-600" />
                            Marcar como Em Andamento
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          const taxTemplate = taxTemplates.find(t => t.id === tax.id.split('-')[0])
                          if (taxTemplate) {
                            onEdit(taxTemplate)
                          } else {
                            // Fallback: se não encontrar o template, usa o TaxDueDate como base (com risco de dados incompletos)
                            onEdit(tax as unknown as Tax)
                          }
                        }}>
                          <Pencil className="size-4 mr-2" />
                          Editar Template
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          <Trash2 className="size-4 mr-2" />
                          Excluir Template
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {viewingTax && (
        <TaxDetails tax={viewingTax} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      )}
    </div>
  )
}