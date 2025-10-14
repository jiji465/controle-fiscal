"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, AlertCircle, AlertTriangle, Flag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Tax, Client } from "@/lib/types" // Import Client type
import { toast } from "@/hooks/use-toast" // Import toast

type TaxFormProps = {
  tax?: Tax
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tax: Tax) => void
  clients: Client[] // Pass clients to the form
}

export function TaxForm({ tax, open, onOpenChange, onSave, clients }: TaxFormProps) {
  const [formData, setFormData] = useState<Partial<Tax>>(
    tax || {
      name: "",
      description: "",
      federalTaxCode: "",
      clientId: undefined, // Initialize clientId
      dueDay: undefined,
      dueMonth: undefined, // Initialize dueMonth
      recurrence: "monthly",
      recurrenceInterval: 1,
      autoGenerate: false,
      weekendRule: "postpone",
      notes: "",
      tags: [],
    },
  )

  const [newTag, setNewTag] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const taxData: Tax = {
      id: tax?.id || crypto.randomUUID(),
      name: formData.name!,
      description: formData.description!,
      federalTaxCode: formData.federalTaxCode,
      clientId: formData.clientId === "none" ? undefined : formData.clientId, // Save clientId, or undefined if 'none'
      dueDay: formData.dueDay ? Number(formData.dueDay) : undefined,
      dueMonth: formData.dueMonth ? Number(formData.dueMonth) : undefined, // Save dueMonth
      recurrence: formData.recurrence as any,
      recurrenceInterval: formData.recurrenceInterval,
      recurrenceEndDate: formData.recurrenceEndDate,
      autoGenerate: formData.autoGenerate || false,
      weekendRule: formData.weekendRule as "postpone" | "anticipate" | "keep",
      notes: formData.notes,
      tags: formData.tags || [],
      createdAt: tax?.createdAt || new Date().toISOString(),
    }
    onSave(taxData)
    onOpenChange(false)
    toast({
      title: "Imposto salvo!",
      description: `O imposto "${taxData.name}" foi salvo com sucesso.`,
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tax ? "Editar Imposto" : "Novo Imposto"}</DialogTitle>
          <DialogDescription>Configure o imposto com todas as regras e vencimentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Básicas
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Imposto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: ICMS, ISS, IRPJ"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o imposto..."
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="federalTaxCode">Código Federal (Opcional)</Label>
                <Input
                  id="federalTaxCode"
                  value={formData.federalTaxCode}
                  onChange={(e) => setFormData({ ...formData, federalTaxCode: e.target.value })}
                  placeholder="Ex: 1234"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientId">Cliente (Opcional)</Label>
                <Select
                  value={formData.clientId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Imposto global (sem cliente específico)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Imposto global (sem cliente específico)</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecione um cliente para tornar este imposto específico para ele.
                </p>
              </div>
            </div>

            {/* Configuração de Recorrência */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="text-sm font-semibold">Configuração de Recorrência</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="recurrence">Tipo de Recorrência *</Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) => setFormData({ ...formData, recurrence: value as any })}
                  >
                    <SelectTrigger id="recurrence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="bimonthly">Bimestral</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrence === "custom" && (
                  <div className="grid gap-2">
                    <Label htmlFor="recurrenceInterval">Intervalo (meses)</Label>
                    <Input
                      id="recurrenceInterval"
                      type="number"
                      min="1"
                      value={formData.recurrenceInterval || 1}
                      onChange={(e) => setFormData({ ...formData, recurrenceInterval: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoGenerate">Gerar Automaticamente</Label>
                  <p className="text-xs text-muted-foreground">Criar próximas ocorrências automaticamente</p>
                </div>
                <Switch
                  id="autoGenerate"
                  checked={formData.autoGenerate}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoGenerate: checked })}
                />
              </div>

              {formData.autoGenerate && (
                <div className="grid gap-2">
                  <Label htmlFor="recurrenceEndDate">Data Final (Opcional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={formData.recurrenceEndDate || ""}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco para recorrência indefinida</p>
                </div>
              )}
            </div>

            {/* Vencimentos */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vencimentos</h3>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dueDay">Dia do Vencimento (Opcional)</Label>
                  <Input
                    id="dueDay"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDay: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="Ex: 15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dia padrão de vencimento (pode ser sobrescrito na obrigação)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dueMonth">Mês Específico (Opcional)</Label>
                  <Input
                    id="dueMonth"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.dueMonth || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dueMonth: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="1-12"
                  />
                  <p className="text-xs text-muted-foreground">Para impostos anuais ou específicos</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="weekendRule">Regra de Final de Semana *</Label>
                  <Select
                    value={formData.weekendRule}
                    onValueChange={(value) => setFormData({ ...formData, weekendRule: value as any })}
                  >
                    <SelectTrigger id="weekendRule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postpone">Postergar</SelectItem>
                      <SelectItem value="anticipate">Antecipar</SelectItem>
                      <SelectItem value="keep">Manter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Adicionais
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais, comentários internos..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Adicionar tag..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Adicionar
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Imposto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}