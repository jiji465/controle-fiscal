"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InstallmentForm } from "./installment-form"
import { InstallmentDetails } from "./installment-details"
import {
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  Plus,
  CheckCircle2,
  Eye,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  Clock,
  DollarSign,
} from "lucide-react"
import type { InstallmentWithDetails, Client, Installment } from "@/lib/types" // Import Installment
import { saveInstallment, deleteInstallment } from "@/lib/storage"
import { formatDate, isOverdue } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"
import { toast } from "@/hooks/use-toast"

type InstallmentListProps = {
  installments: InstallmentWithDetails[]
  clients: Client[]
  onUpdate: () => void
}

export function InstallmentList({ installments, clients, onUpdate }: InstallmentListProps) {
  const [search, setSearch] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [editingInstallment, setEditingInstallment] = useState<InstallmentWithDetails | undefined>()
  const [viewingInstallment, setViewingInstallment] = useState<InstallmentWithDetails | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"dueDate" | "client" | "status">("dueDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const filteredInstallments = installments.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.client.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.description?.toLowerCase().includes(search.toLowerCase())

    const matchesClient = clientFilter === "all" || inst.clientId === clientFilter

    return matchesSearch && matchesClient
  })

  const sortedInstallments = [...filteredInstallments].sort((a, b) => {
    let comparison = 0

    if (sortBy === "dueDate") {
      comparison = new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime()
    } else if (sortBy === "client") {
      comparison = a.client.name.localeCompare(b.client.name)
    } else if (sortBy === "status") {
      const statusOrder = { overdue: 0, pending: 1, paid: 2 }
      comparison = statusOrder[a.status] - statusOrder[b.status]
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  const handleSave = (installment: Installment) => {
    saveInstallment(installment)
    onUpdate()
    setEditingInstallment(undefined)
    toast({
      title: "Parcelamento salvo!",
      description: `O parcelamento "${installment.name}" foi salvo com sucesso.`,
    });
  }

  const handleDelete = (id: string) => {
    if (confirm("⚠️ Tem certeza que deseja excluir este parcelamento?\n\nEsta ação não pode ser desfeita.")) {
      deleteInstallment(id)
      onUpdate()
      toast({
        title: "Parcelamento excluído!",
        description: "O parcelamento foi removido com sucesso.",
        variant: "destructive",
      });
    }
  }

  const handleMarkAsPaid = (installment: InstallmentWithDetails) => {
    const updated = {
      ...installment,
      status: "paid" as const,
      paidAt: new Date().toISOString(),
      paidBy: "Usuário", // Or actual user name
    }
    saveInstallment(updated)
    onUpdate()
    toast({
      title: "Parcelamento pago!",
      description: `O parcelamento "${installment.name}" foi marcado como pago.`,
      variant: "default",
    });
  }

  const handleEdit = (installment: InstallmentWithDetails) => {
    setEditingInstallment(installment)
    setIsFormOpen(true)
  }

  const handleView = (installment: InstallmentWithDetails) => {
    setViewingInstallment(installment)
    setIsDetailsOpen(true)
  }

  const handleNew = () => {
    setEditingInstallment(undefined)
    setIsFormOpen(true)
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

  const getStatusBadge = (installment: InstallmentWithDetails) => {
    if (installment.status === "paid") {
      return (
        <div className="flex flex-col gap-1">
          <Badge className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="size-3 mr-1" />
            Pago
          </Badge>
          {installment.paidAt && (
            <span className="text-xs text-muted-foreground">{formatDate(installment.paidAt.split("T")[0])}</span>
          )}
        </div>
      )
    }
    if (installment.status === "overdue" || isOverdue(installment.calculatedDueDate)) {
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

  const QuickActionButtons = ({ installment }: { installment: InstallmentWithDetails }) => {
    if (installment.status === "paid") {
      return null
    }

    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="default"
          onClick={() => handleMarkAsPaid(installment)}
          className="h-7 text-xs bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="size-3 mr-1" />
          Marcar como Pago
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
            placeholder="Buscar parcelamentos..."
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
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-2" />
            Novo Parcelamento
          </Button>
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcelamento</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("client")} className="-ml-3">
                  Cliente
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
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
            {sortedInstallments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum parcelamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              sortedInstallments.map((installment) => (
                <TableRow
                  key={installment.id}
                  className={
                    isOverdue(installment.calculatedDueDate) && installment.status !== "paid"
                      ? "bg-red-50/50 dark:bg-red-950/10"
                      : ""
                  }
                ><TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{installment.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {installment.installmentNumber}/{installment.totalInstallments}
                      </div>
                      {installment.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">{installment.description}</div>
                      )}
                    </div>
                  </TableCell><TableCell>
                    <div className="font-medium">{installment.client.name}</div>
                  </TableCell><TableCell>{getStatusBadge(installment)}</TableCell><TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">{formatDate(installment.calculatedDueDate)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRelativeDate(installment.calculatedDueDate)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getRecurrenceDescription(installment)}
                      </Badge>
                    </div>
                  </TableCell><TableCell>
                    <QuickActionButtons installment={installment} />
                  </TableCell><TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(installment)}>
                          <Eye className="size-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(installment)}>
                          <Pencil className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(installment.id)} className="text-destructive">
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell></TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InstallmentForm
        installment={editingInstallment}
        clients={clients}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
      />

      {viewingInstallment && (
        <InstallmentDetails installment={viewingInstallment} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      )}
    </div>
  )
}