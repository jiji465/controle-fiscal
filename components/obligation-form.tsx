import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Link } from "lucide-react"
import type { Obligation, Client, Tax, ObligationWithDetails, ObligationHistoryEntry, RecurrenceType, WeekendRule } from "@/lib/types"
import { createObligation } from "@/lib/factory"
import { toast } from "@/hooks/use-toast"

interface ObligationFormProps {
  obligation?: ObligationWithDetails
  clients: Client[]
  taxes: Tax[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (obligation: Obligation) => Promise<void>
}

export function ObligationForm({ obligation, clients, taxes, open, onOpenChange, onSave }: ObligationFormProps) {
  const [formData, setFormData] = useState<Partial<Obligation>>(createObligation())
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("")

  useEffect(() => {
    if (obligation) {
      setFormData(obligation)
    } else {
      setFormData(createObligation())
    }
  }, [obligation])

  const handleChange = (field: keyof Obligation, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTaxChange = (taxId: string) => {
    const selectedTax = taxes.find(t => t.id === taxId)
    if (selectedTax) {
      setFormData(prev => ({
        ...prev,
        taxId: taxId,
        name: selectedTax.name,
        description: selectedTax.description,
        dueDay: selectedTax.dueDay || prev.dueDay,
        recurrence: selectedTax.recurrence,
        recurrenceInterval: selectedTax.recurrenceInterval,
        recurrenceEndDate: selectedTax.recurrenceEndDate,
        autoGenerate: selectedTax.autoGenerate,
        weekendRule: selectedTax.weekendRule,
        notes: selectedTax.notes || prev.notes,
        tags: selectedTax.tags || prev.tags,
        clientId: selectedTax.clientId || prev.clientId,
      }))
    } else {
      setFormData(prev => ({ ...prev, taxId: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.clientId || !formData.calculatedDueDate) {
      toast({
        title: "Erro de validação",
        description: "Nome, Cliente e Data de Vencimento são obrigatórios.",
        variant: "destructive",
      })
      return
    }

    const isEditing = !!formData.id
    const history = formData.history || []
    const newHistoryEntry: ObligationHistoryEntry = {
      id: crypto.randomUUID(),
      action: isEditing ? "edited" : "created",
      description: isEditing ? "Obrigação editada" : "Obrigação criada",
      timestamp: new Date().toISOString(),
    }

    const finalObligation: Obligation = {
      ...createObligation(),
      ...formData,
      id: formData.id || crypto.randomUUID(),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: "obligation",
      history: [...history, newHistoryEntry],
    } as Obligation

    try {
      await onSave(finalObligation)
    } catch (error) {
      console.error("Erro ao salvar obrigação:", error)
    }
  }

  const addAttachment = () => {
    if (newAttachmentUrl.trim() && !formData.attachments?.includes(newAttachmentUrl.trim())) {
      setFormData({ ...formData, attachments: [...(formData.attachments || []), newAttachmentUrl.trim()] });
      setNewAttachmentUrl("");
    }
  }

  const removeAttachment = (url: string) => {
    setFormData({ ...formData, attachments: formData.attachments?.filter((a) => a !== url) });
  };

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{obligation ? "Editar Obrigação" : "Nova Obrigação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Obrigação</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="taxId">Vincular a Imposto (Opcional)</Label>
                <Select
                  value={formData.taxId || ""}
                  onValueChange={handleTaxChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Imposto Base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {taxes.map((tax) => (
                      <SelectItem key={tax.id} value={tax.id}>
                        {tax.name} ({tax.federalTaxCode})
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category || "federal"}
                  onValueChange={(value) => handleChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">Estadual</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority || "medium"}
                  onValueChange={(value) => handleChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Responsável</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo || ""}
                  onChange={(e) => handleChange("assignedTo", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrence">Recorrência</Label>
              <Select
                value={formData.recurrence || "none"}
                onValueChange={(value) => handleChange("recurrence", value)}
                disabled={!!formData.taxId}
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
                  disabled={!!formData.taxId || formData.recurrence === "bimonthly"}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoGenerate"
                checked={formData.autoGenerate}
                onCheckedChange={(checked) => handleChange("autoGenerate", checked)}
                disabled={!!formData.taxId}
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
                    disabled={!!formData.taxId}
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
              <Label htmlFor="protocol">Protocolo/Número de Referência</Label>
              <Input
                id="protocol"
                value={formData.protocol || ""}
                onChange={(e) => handleChange("protocol", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachments">Anexos (Links)</Label>
              <div className="flex gap-2">
                <Input
                  id="attachments"
                  placeholder="Adicionar link de anexo"
                  value={newAttachmentUrl}
                  onChange={(e) => setNewAttachmentUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAttachment();
                    }
                  }}
                />
                <Button type="button" onClick={addAttachment} variant="outline" size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>
              {formData.attachments && formData.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.attachments.map((url, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <Link className="size-3" />
                      Anexo {index + 1}
                      <X className="size-3 cursor-pointer" onClick={() => removeAttachment(url)} />
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
            <Button type="submit">{obligation ? "Salvar Alterações" : "Criar Obrigação"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}