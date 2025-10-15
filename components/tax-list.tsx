"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaxDetails } from "./tax-details"
import {
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  PlayCircle,
  Eye,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  Clock,
} from "lucide-react"
import type { TaxDueDate, Client, Tax, FiscalEventStatus } from "@/lib/types"
import { deleteTax, saveTaxStatus } from "@/lib/storage"
import { formatDate, isOverdue } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"

type TaxListProps = {
  taxesDueDates: TaxDueDate[]
  clients: Client[]
  taxTemplates: Tax[]
  onUpdate: () => void
  onEdit: (tax: Tax) => void
}

export function TaxList({ taxesDueDates, clients, taxTemplates, onUpdate, onEdit }: TaxListProps) {
  const [search, setSearch] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [viewingTaxDetails, setViewingTaxDetails] = useState<TaxDueDate | undefined>()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"dueDate" | "client" | "status">("dueDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);

  const filteredTaxes = taxesDueDates.filter((tax) => {
    const matchesSearch =
      tax.name.toLowerCase().includes(search.toLowerCase()) ||
      tax.client.name.toLowerCase().includes(search.toLowerCase()) ||
      tax.description?.toLowerCase().includes(search.toLowerCase()) ||
      tax.federalTaxCode?.toLowerCase().includes(search.toLowerCase())

    const matchesClient = clientFilter === "all" || tax.clientId === clientFilter

    return matchesSearch && matchesClient
  })

  const sortedTaxes = [...filteredTaxes].sort((a, b) => {
    let comparison = 0

    if (sortBy === "dueDate") {
      comparison = new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime()
    } else if (sortBy === "client") {
      comparison = a.client.name.localeCompare(b.client.name)
    } else if (sortBy === "status") {
      const statusOrder: Record<FiscalEventStatus, number> = { overdue: 0, pending: 1, in_progress: 2, completed: 3 }
      comparison = statusOrder[a.status] - statusOrder[b.status]
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  const handleDeleteTaxTemplate = (id: string) => {
    if (confirm("⚠️ Tem certeza que deseja excluir este imposto?\n\nEsta ação não pode ser desfeita e removerá todas as ocorrências geradas por ele.")) {
      deleteTax(id)
      onUpdate()
      toast({
        title: "Imposto excluído!",
        description: "O imposto foi removido com sucesso.",
        variant: "destructive",
      });
    }
  }

  const handleCompleteTax = (taxDueDate: TaxDueDate) => {
    saveTaxStatus(taxDueDate.id, "completed")
    onUpdate()
    toast({
      title: "Imposto processado!",
      description: `O imposto "${taxDueDate.name}" foi marcado como processado.`,
    });
  }

  const handleInProgressTax = (taxDueDate: TaxDueDate) => {
    saveTaxStatus(taxDueDate.id, "in_progress")
    onUpdate()
    toast({
      title: "Imposto em processamento!",
      description: `O imposto "${taxDueDate.name}" foi marcado como em processamento.`,
    });
  }

  const handleViewTaxDetails = (taxDueDate: TaxDueDate) => {
    setViewingTaxDetails(taxDueDate)
    setIsDetailsOpen(true)
  }

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Amanhã"
    if (diffDays === -1) return "Ontem"
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`
    if (diffDays <= 7) return `Em ${diffDays} dias`

    return formatDate(dateString)
  }

  const getStatusBadge = (tax: TaxDueDate) => {
    if (tax.status === "completed") {
      return (
        <div className="flex flex-col gap-1">
          <Badge className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="size-3 mr-1" />
            Processado
          </Badge>
        </div>
      )
    }
    if (tax.status === "in_progress") {
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
            <PlayCircle className="size-3 mr-1" />
            Em Processamento
        </Badge>
      )
    }
    if (tax.status === "overdue" || isOverdue(tax.calculatedDueDate)) {
      return (
        <Badge variant="destructive" className="bg-red-600 text-white">
          <AlertTriangle className="size-3 mr-1" />
          Atrasado
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="size-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  const toggleSort = (field: "dueDate" | "client" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const handleSelectTax = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTaxIds((prev) => [...prev, id]);
    } else {
      setSelectedTaxIds((prev) => prev.filter((_id) => _id !== id));
    }
  };

  const handleSelectAllTaxes = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedTaxIds(sortedTaxes.map((tax) => tax.id));
    } else {
      setSelectedTaxIds([]);
    }
  };

  const handleBulkComplete = () => {
    if (selectedTaxIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja marcar ${selectedTaxIds.length} imposto(s) como processado(s)?`)) return;

    selectedTaxIds.forEach((id) => {
      const tax = taxesDueDates.find((t) => t.id === id);
      if (tax) {
        handleCompleteTax(tax);
      }
    });
    setSelectedTaxIds([]);
  };

  const handleBulkInProgress = () => {
    if (selectedTaxIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja marcar ${selectedTaxIds.length} imposto(s) como em processamento?`)) return;

    selectedTaxIds.forEach((id) => {
      const tax = taxesDueDates.find((t) => t.id === id);
      if (tax) {
        handleInProgressTax(tax);
      }
    });
    setSelectedTaxIds([]);
  };

  const QuickActionButtons = ({ tax }: { tax: TaxDueDate }) => {
    if (tax.status === "completed") {
      return null
    }

    return (
      <div className="flex gap-1">
        {tax.status === "pending" && (
          <Button size="sm" variant="outline" onClick={() => handleInProgressTax(tax)} className="h-7 text-xs">
            <PlayCircle className="size-3 mr-1" />
            Iniciar
          </Button>
        )}
        <Button
          size="sm"
          variant="default"
          onClick={() => handleCompleteTax(tax)}
          className="h-7 text-xs bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="size-3 mr-1" />
          Processar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar impostos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="size-4 mr-2" />
            Filtros
            {clientFilter !== "all" && (
              <Badge variant="secondary" className="ml-2 size-5 rounded-full p-0 flex items-center justify-center">
                1
              </Badge>
            )}
          </Button>
          {/* New button is now handled by the parent page */}
        </div>
      </div>

      {showFilters && (
        <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {selectedTaxIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-primary/10 dark:bg-primary/20">
          <span className="text-sm font-medium">
            {selectedTaxIds.length} imposto(s) selecionado(s)
          </span>
          <Button variant="outline" size="sm" onClick={handleBulkComplete} className="ml-auto">
            <CheckCircle2 className="size-4 mr-2" />
            Processar Selecionados
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkInProgress}>
            <PlayCircle className="size-4 mr-2" />
            Iniciar Selecionados
          </Button>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedTaxIds.length === sortedTaxes.length && sortedTaxes.length > 0}
                  onCheckedChange={(checked) => handleSelectAllTaxes(checked as boolean)}
                  aria-label="Selecionar todos os impostos"
                />
              </TableHead>
              <TableHead>Imposto</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("client")} className="-ml-3">
                  Cliente
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
              <TableHead>Código Federal</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("status")} className="-ml-3">
                  Status
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("dueDate")} className="-ml-3">
                  Vencimento
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
              <TableHead>Ações Rápidas</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTaxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum imposto encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedTaxes.map((tax) => (
                <TableRow
                  key={tax.id}
                  className={
                    isOverdue(tax.calculatedDueDate) && tax.status !== "completed"
                      ? "bg-red-50/50 dark:bg-red-950/10"
                      : ""
                  }
                ><TableCell>
                    <Checkbox
                      checked={selectedTaxIds.includes(tax.id)}
                      onCheckedChange={(checked) => handleSelectTax(tax.id, checked as boolean)}
                      aria-label={`Selecionar imposto ${tax.name}`}
                    />
                  </TableCell><TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{tax.name}</div>
                      </div>
                      {tax.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">{tax.description}</div>
                      )}
                    </div>
                  </TableCell><TableCell>
                    <div className="font-medium">{tax.client.name}</div>
                  </TableCell><TableCell>
                    {tax.federalTaxCode ? (
                      <Badge variant="outline">{tax.federalTaxCode}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell><TableCell>{getStatusBadge(tax)}</TableCell><TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">{formatDate(tax.calculatedDueDate)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRelativeDate(tax.calculatedDueDate)}
                      </div>
                      {tax.recurrence && (
                        <Badge variant="secondary" className="text-xs">
                          {getRecurrenceDescription(tax)}
                        </Badge>
                      )}
                    </div>
                  </TableCell><TableCell>
                    <QuickActionButtons tax={tax} />
                  </TableCell><TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTaxDetails(tax)}>
                          <Eye className="size-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(taxTemplates.find(t => t.id === tax.id.split('-')[0]) || tax)}>
                          <Pencil className="size-4 mr-2" />
                          Editar Imposto
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTaxTemplate(tax.id.split('-')[0])} className="text-destructive">
                          <Trash2 className="size-4 mr-2" />
                          Excluir Imposto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell></TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {viewingTaxDetails && (
        <TaxDetails tax={viewingTaxDetails} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      )}
    </div>
  )
}