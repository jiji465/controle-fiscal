import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import type { Installment, Client, InstallmentWithDetails, RecurrenceType, WeekendRule } from "@/lib/types"
import { createInstallment } from "@/lib/factory"
import { toast } from "@/hooks/use-toast"

interface InstallmentFormProps {
  installment?: InstallmentWithDetails
  clients: Client[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (installment: Installment) => void
}

export function InstallmentForm({ installment, clients, open, onOpenChange, onSave }: InstallmentFormProps) {
  const [formData, setFormData] = useState<Partial<Installment>>(createInstallment())
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    if (installment) {
      setFormData(installment)
    } else {
      setFormData(createInstallment())
    }
  }, [installment])

  const handleChange = (field: keyof Installment, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag.trim()] })
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tag) })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.clientId || !formData.calculatedDueDate) {
      toast({
        title: "Erro de validação",
        description: "Nome, Cliente e Data de Vencimento são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    // Garante que o objeto final é do tipo Installment
    const finalInstallment: Installment = {
      ...createInstallment(),
      ...formData,
      id: formData.id || crypto.randomUUID(),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: "installment",
    } as Installment

    onSave(finalInstallment)
  }

  const recurrenceOptions: { value: RecurrenceType, label: string }[] = [
    { value: "none", label: "Única" },
    { value: "monthly", label: "Mensal" },
    { value: "bimonthly", label: "Bimestral" },
    { value: "quarterly", label: "Trimestral" },
    { value: "semiannual", label: "Semestral" },
    { value: "annual", label: "Anual" },
    { value: "custom", label: "Personalizada (N meses)" },
  ]

  const weekendRuleOptions: { value: WeekendRule, label: string }[] = [
    { value: "none", label: "Nenhuma" },
    { value: "advance", label: "Antecipar (para sexta)" },
    { value: "postpone", label: "Postergar (para segunda)" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{installment ? "Editar Parcelamento" : "Novo Parcelamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Parcelamento</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select
                value={formData.clientId || ""}
                onValueChange={(value) => handleChange("clientId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalInstallments">Total de Parcelas</Label>
                <Input
                  id="totalInstallments"
                  type="number"
                  min="1"
                  value={formData.totalInstallments || 1}
                  onChange={(e) => handleChange("totalInstallments", Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installmentNumber">Número da Parcela Atual</Label>
                <Input
                  id="installmentNumber"
                  type="number"
                  min="1"
                  max={formData.totalInstallments}
                  value={formData.installmentNumber || 1}
                  onChange={(e) => handleChange("installmentNumber", Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recorrência</Label>
              <Select
                value={formData.recurrence || "none"}
                onValueChange={(value) => handleChange("recurrence", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Recorrência" />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.recurrence === "custom" || formData.recurrence === "bimonthly") && (
              <div className="grid gap-2">
                <Label htmlFor="recurrenceInterval">Intervalo de Recorrência (em meses)</Label>
                <Input
                  id="recurrenceInterval"
                  type="number"
                  min="1"
                  value={formData.recurrenceInterval || 1}
                  onChange={(e) => handleChange("recurrenceInterval", Number(e.target.value))}
                  disabled={formData.recurrence === "bimonthly"}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoGenerate"
                checked={formData.autoGenerate}
                onCheckedChange={(checked) => handleChange("autoGenerate", checked)}
              />
              <Label htmlFor="autoGenerate">Gerar automaticamente novas ocorrências</Label>
            </div>

            {formData.autoGenerate && (
              <div className="grid gap-2">
                <Label htmlFor="recurrenceEndDate">Data Final da Recorrência (Opcional)</Label>
                <Input
                  id="recurrenceEndDate"
                  type="date"
                  value={formData.recurrenceEndDate || ""}
                  onChange={(e) => handleChange("recurrenceEndDate", e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calculatedDueDate">Data de Vencimento Base</Label>
                <Input
                  id="calculatedDueDate"
                  type="date"
                  value={formData.calculatedDueDate || ""}
                  onChange={(e) => handleChange("calculatedDueDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekendRule">Regra de Fim de Semana</Label>
                <Select
                    value={formData.weekendRule}
                    onValueChange={(value) => handleChange("weekendRule", value as WeekendRule)}
                  >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Regra" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekendRuleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Adicionar tag (ex: REFIS, PGFN)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline" size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X className="size-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{installment ? "Salvar Alterações" : "Criar Parcelamento"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}