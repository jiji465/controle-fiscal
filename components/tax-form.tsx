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
import type { Tax, Client, RecurrenceType, WeekendRule } from "@/lib/types"
import { createTax } from "@/lib/factory"
import { toast } from "@/hooks/use-toast"

interface TaxFormProps {
  tax?: Tax
  clients: Client[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tax: Tax) => void
}

export function TaxForm({ tax, clients, open, onOpenChange, onSave }: TaxFormProps) {
  const [formData, setFormData] = useState<Partial<Tax>>(createTax())
  const [initialDueDate, setInitialDueDate] = useState<Date | undefined>()
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    if (tax) {
      setFormData(tax);
      if (tax.dueDay) {
        const year = new Date().getFullYear();
        const month = tax.dueMonth ? tax.dueMonth - 1 : new Date().getMonth();
        const day = tax.dueDay;
        const date = new Date(year, month, day);
        setInitialDueDate(date);
      }
    } else {
      setFormData(createTax())
      setInitialDueDate(undefined)
    }
  }, [tax])

  const handleChange = (field: keyof Tax, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setInitialDueDate(date)
    if (date) {
      setFormData((prev) => ({
        ...prev,
        dueDay: date.getDate(),
        dueMonth: prev.recurrence === 'annual' ? date.getMonth() + 1 : undefined,
        calculatedDueDate: date.toISOString().split("T")[0],
      }))
    }
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

    // Garante que o objeto final é do tipo Tax
    const finalTax: Tax = {
      ...createTax(),
      ...formData,
      id: formData.id || crypto.randomUUID(),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: "tax",
      // Garante que dueMonth é undefined se não for anual
      dueMonth: formData.recurrence === 'annual' ? formData.dueMonth : undefined,
    } as Tax

    onSave(finalTax)
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
          <DialogTitle>{tax ? "Editar Imposto" : "Novo Imposto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Imposto</Label>
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
                <Label htmlFor="federalTaxCode">Cód. Federal</Label>
                <Input
                  id="federalTaxCode"
                  value={formData.federalTaxCode || ""}
                  onChange={(e) => handleChange("federalTaxCode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateTaxCode">Cód. Estadual</Label>
                <Input
                  id="stateTaxCode"
                  value={formData.stateTaxCode || ""}
                  onChange={(e) => handleChange("stateTaxCode", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipalTaxCode">Cód. Municipal</Label>
              <Input
                id="municipalTaxCode"
                value={formData.municipalTaxCode || ""}
                onChange={(e) => handleChange("municipalTaxCode", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recorrência</Label>
              <Select
                value={formData.recurrence || "none"}
                onValueChange={(value) => {
                  const newRecurrence = value as RecurrenceType;
                  let dueMonth = formData.dueMonth;
                  if (initialDueDate) {
                    // Se mudar para anual, salva o mês atual
                    if (newRecurrence === 'annual') {
                      dueMonth = initialDueDate.getMonth() + 1;
                    } else {
                      dueMonth = undefined;
                    }
                  }
                  setFormData((prev) => ({
                    ...prev,
                    recurrence: newRecurrence,
                    dueMonth: dueMonth
                  }));
                }}
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
                  onChange={(e) => {
                    const date = new Date(e.target.value + "T00:00:00");
                    const day = date.getDate();
                    const month = date.getMonth() + 1;
                    handleDateChange(date);
                    setFormData((prev) => ({
                      ...prev,
                      calculatedDueDate: e.target.value,
                      dueDay: day,
                      dueMonth: prev.recurrence === 'annual' ? month : undefined,
                    }));
                  }}
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
                  placeholder="Adicionar tag (ex: ICMS, IPI)"
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
            <Button type="submit">{tax ? "Salvar Alterações" : "Criar Imposto"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}