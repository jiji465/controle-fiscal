"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { TaxForm } from "@/components/tax-form"
import { GlobalSearch } from "@/components/global-search"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getTaxes, saveTax, deleteTax, getClients, getObligations } from "@/lib/storage"
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertTriangle,
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react"
import type { Tax, Client, Obligation } from "@/lib/types"
import { toast } from "@/hooks/use-toast" // Import toast

export default function ImpostosPage() {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [editingTax, setEditingTax] = useState<Tax | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all") // Keep tabs for future filtering by recurrence/dueDay
  const [searchOpen, setSearchOpen] = useState(false)

  const updateData = () => {
    setTaxes(getTaxes())
    setClients(getClients())
    setObligations(getObligations())
  }

  useEffect(() => {
    updateData()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSave = (tax: Tax) => {
    saveTax(tax)
    updateData()
    setEditingTax(undefined)
    setIsFormOpen(false)
    toast({
      title: "Imposto salvo!",
      description: `O imposto "${tax.name}" foi salvo com sucesso.`,
    });
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este imposto?")) {
      deleteTax(id)
      updateData()
      toast({
        title: "Imposto excluído!",
        description: "O imposto foi removido com sucesso.",
        variant: "destructive",
      });
    }
  }

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax)
    setIsFormOpen(true)
  }

  const handleNew = () => {
    setEditingTax(undefined)
    setIsFormOpen(true)
  }

  // Removed handleStartTax and handleCompleteTax as they are for Obligations, not Tax templates.

  // For now, getFilteredTaxes will just return all taxes, as status is no longer on Tax type.
  // We can re-introduce filtering by recurrence or dueDay if needed in the future.
  const getFilteredTaxes = () => {
    return taxes
  }

  // Removed getStatusBadge as status is no longer on Tax type.
  // Taxes are templates, their "status" is managed by the Obligations that use them.

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-balance">Impostos</h1>
              <p className="text-lg text-muted-foreground">Gerencie todos os impostos e seus vencimentos</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSearchOpen(true)} className="gap-2">
                <Search className="size-4" />
                Buscar
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Button onClick={handleNew}>
                <Plus className="size-4 mr-2" />
                Novo Imposto
              </Button>
            </div>
          </div>

          {/* Tabs are kept but will display all taxes for now, as status is removed from Tax type */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 h-auto md:grid-cols-5">
              <TabsTrigger value="all" className="flex flex-col gap-1 py-3">
                <span className="text-sm font-medium">Todos os Impostos</span>
                <Badge variant="secondary" className="text-xs">
                  {taxes.length}
                </Badge>
              </TabsTrigger>
              {/* Other tabs (pending, in_progress, completed, overdue) are not directly applicable to Tax templates,
                  but can be re-purposed for filtering by recurrence type or due day if desired.
                  For now, they will show the same list as 'all'. */}
              <TabsTrigger value="pending" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span className="text-sm font-medium">Mensais</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {taxes.filter(t => t.recurrence === "monthly").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <PlayCircle className="size-3.5" />
                  <span className="text-sm font-medium">Anuais</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {taxes.filter(t => t.recurrence === "annual").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span className="text-sm font-medium">Personalizados</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                >
                  {taxes.filter(t => t.recurrence === "custom").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  <span className="text-sm font-medium">Outros</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                >
                  {taxes.filter(t => t.recurrence !== "monthly" && t.recurrence !== "annual" && t.recurrence !== "custom").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <Card className="p-6">
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cliente</TableHead> {/* New column for client */}
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento Padrão</TableHead>
                        <TableHead>Recorrência</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredTaxes().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8"> {/* Updated colspan */}
                            Nenhum imposto encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredTaxes().map((tax) => (
                          <TableRow key={tax.id}>
                            <TableCell className="font-medium">{tax.name}</TableCell>
                            <TableCell>
                              {tax.clientId ? clients.find(c => c.id === tax.clientId)?.name || "Cliente Desconhecido" : "Global"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{tax.description}</TableCell>
                            <TableCell>{tax.dueDay ? `Dia ${tax.dueDay}` : "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{tax.recurrence}</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(tax)}>
                                    <Pencil className="size-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(tax.id)} className="text-destructive">
                                    <Trash2 className="size-4 mr-2" />
                                    Excluir
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
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <TaxForm tax={editingTax} open={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSave} clients={clients} />
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        clients={clients}
        taxes={taxes}
        obligations={obligations}
      />
    </div>
  )
}