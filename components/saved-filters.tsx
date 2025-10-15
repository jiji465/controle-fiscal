import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Trash2, Filter } from "lucide-react"
import type { SavedFilter } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface SavedFiltersProps {
  currentFilters: Record<string, any>
  onApply: (filters: Record<string, any>) => void
}

export function SavedFilters({ currentFilters, onApply }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([
    { id: "1", name: "Atrasados Críticos", filters: { status: "overdue", priority: "urgent" } },
    { id: "2", name: "Próximos 7 Dias", filters: { dueDate: "next_7_days" } },
  ])
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [newFilterName, setNewFilterName] = useState("")

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      toast({ title: "Nome obrigatório", description: "Dê um nome ao seu filtro.", variant: "destructive" })
      return
    }

    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: newFilterName.trim(),
      filters: currentFilters,
    }

    setSavedFilters([...savedFilters, newFilter])
    setIsSaveDialogOpen(false)
    setNewFilterName("")
    toast({ title: "Filtro Salvo", description: `O filtro "${newFilter.name}" foi salvo com sucesso.` })
  }

  const handleDeleteFilter = (id: string) => {
    setSavedFilters(savedFilters.filter(f => f.id !== id))
    toast({ title: "Filtro Excluído", description: "O filtro foi removido." })
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <Button variant="outline" onClick={() => setIsSaveDialogOpen(true)}>
          <Star className="size-4 mr-2" /> Salvar Filtro
        </Button>

        <div className="relative">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="size-4" /> Filtros Salvos
          </Button>
          {/* Dropdown de Filtros Salvos (Simulação) */}
          <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-gray-800 border rounded-md shadow-lg">
            <ScrollArea className="h-40">
              {savedFilters.map(filter => (
                <div key={filter.id} className="flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <span className="cursor-pointer text-sm" onClick={() => onApply(filter.filters)}>
                    {filter.name}
                  </span>
                  <Button variant="ghost" size="icon" className="size-6" onClick={() => handleDeleteFilter(filter.id)}>
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Salvar Filtro Atual</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filterName">Nome do Filtro</Label>
              <Input
                id="filterName"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="Ex: Atrasados do Mês"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveFilter}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}